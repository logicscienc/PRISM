import { prisma } from "@/lib/prisma";
import { ReviewStatus } from "../generated/prisma";
import { filterReviewableFiles } from "../lib/review/fileFilter.js";
import { buildReviewPrompt } from "../lib/review/promptBuilder.js";
import { generateReview } from "../lib/ai/reviewClient.js";


export async function processReview(reviewId) {
// fetch the review from the db
    const review = await prisma.review.findUnique({
    where: {
        id: reviewId,
    },
});

// validate it exists
if (!review) {
    throw new Error("Review not found.");
}

const startedAt = new Date();

// update the review status
await prisma.review.update({
    where: {
        id: reviewId,
    },
    data: {
        status: ReviewStatus.PROCESSING,
        startedAt,
    },
});

try{
    // fetching the user
const user = await prisma.user.findUnique({
    where: {
        id: review.userId,
    },
});

// Validate the user
if (!user) {
    throw new Error("User not found.");
}

// validate the Github access token
if (!user.githubAccessToken) {
    throw new Error("GitHub access token not found.");
}


// at first we need to fetch the pull request.
const pullRequestResponse = await fetch(
    `https://api.github.com/repos/${review.owner}/${review.repo}/pulls/${review.prNumber}`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: "application/json",
        },
    }
);
// check the responce
if (!pullRequestResponse.ok) {
    throw new Error("Failed to fetch GitHub pull request.");
}

// parse the responce
const pullRequest = await pullRequestResponse.json();

// validate the pull request
if (!pullRequest || typeof pullRequest !== "object") {
    throw new Error("Invalid pull request response from GitHub.");
}

// GitHub pull request object memory
const reviewContext = {
    // Because the title tells the AI what the Pull Request is trying to do.
    title: pullRequest.title,
    // add the description
      description: pullRequest.body ?? "",
    //  who the author is
    author: pullRequest.user.login,
    //  headBranch: pullRequest.head.ref,
    // baseBranch: pullRequest.base.ref, 
};

// GitHub request to fetch the changed files.
const pullRequestFilesResponse = await fetch(
    `https://api.github.com/repos/${review.owner}/${review.repo}/pulls/${review.prNumber}/files`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: "application/json",
        },
    }
);

if (!pullRequestFilesResponse.ok) {
    throw new Error("Failed to fetch GitHub pull request files.");
}

const pullRequestFiles = await pullRequestFilesResponse.json();

if (!Array.isArray(pullRequestFiles)) {
    throw new Error("Invalid pull request files response from GitHub.");
}
const reviewableFiles = filterReviewableFiles(pullRequestFiles);

const transformedFiles = reviewableFiles.map((file) => {
    return {
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch ?? null,
    };
});


const prompt = buildReviewPrompt(reviewContext, transformedFiles);
const aiResponse = await generateReview(prompt, review.aiModel);

// This saves the overall AI review.

const reviewResult = await prisma.reviewResult.create({
  data: {
    reviewId: review.id,
    score: aiResponse.score,
    summary: aiResponse.summary,
    security: aiResponse.security,
    performance: aiResponse.performance,
    codeQuality: aiResponse.codeQuality,
    edgeCases: aiResponse.edgeCases,
    bestPractices: aiResponse.bestPractices,
    rawResponse: JSON.stringify(aiResponse),
  },
});


await prisma.reviewFinding.createMany({
  data: aiResponse.findings.map((finding) => ({
    reviewId: review.id,
    severity: finding.severity,
    file: finding.file,
    line: finding.line,
    category: finding.category,
    message: finding.message,
    suggestion: finding.suggestion,
  })),
});

const completedAt = new Date();
const durationMs = completedAt.getTime() - startedAt.getTime();

await prisma.review.update({
    where: {
        id: reviewId,
    },
    data: {
        status: ReviewStatus.COMPLETED,
        completedAt,
        durationMs,
    },
});
} catch (error) {
    console.error("Error occurred while processing review:", error);

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    await prisma.review.update({
        where: {
            id: reviewId,
        },
        data: {
            status: ReviewStatus.FAILED,
            errorMessage:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred.",
            completedAt,
            durationMs,
        },
    });

    throw error;
}


}