import { prisma } from "../lib/prisma.js";
import { ReviewStatus } from "../generated/prisma/enums.ts";
import { filterReviewableFiles } from "../lib/review/fileFilter.js";
import { buildReviewPrompt } from "../lib/review/promptBuilder.js";
import { generateReview } from "../lib/ai/reviewClient.js";
import { getGithubAccessToken } from "../lib/github-auth.js";
import { requireUser } from "../lib/auth.js";


export async function processReview(reviewId) {

    console.log("PROCESS REVIEW STARTED:", reviewId);
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

console.log("REVIEW STATUS SET TO PROCESSING:", reviewId);

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

// Get the decrypted and validated GitHub access token.
// We do this through the helper so this controller never directly
// handles the encrypted token stored in the database.
const accessToken = await getGithubAccessToken(user.id);

if (!accessToken) {
    throw new Error("GitHub access token is invalid or unavailable.");
}


// at first we need to fetch the pull request.
const pullRequestResponse = await fetch(
    `https://api.github.com/repos/${review.owner}/${review.repo}/pulls/${review.prNumber}`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
        },
    }
);
// check the responce
if (!pullRequestResponse.ok) {
    const errorBody = await pullRequestResponse.text();

    console.error("GitHub PR fetch failed:");
    console.error("Status:", pullRequestResponse.status);
    console.error("Response:", errorBody);

    throw new Error(
        `Failed to fetch GitHub pull request: ${pullRequestResponse.status}`
    );
}

// parse the responce
const pullRequest = await pullRequestResponse.json();


console.log("GITHUB PR FETCHED:", {
    number: pullRequest.number,
    title: pullRequest.title,
});

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
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
        },
    }
);

if (!pullRequestFilesResponse.ok) {
    throw new Error("Failed to fetch GitHub pull request files.");
}

const pullRequestFiles = await pullRequestFilesResponse.json();
console.log("GITHUB PR FILES FETCHED:", pullRequestFiles.length);

if (!Array.isArray(pullRequestFiles)) {
    throw new Error("Invalid pull request files response from GitHub.");
}
const reviewableFiles = filterReviewableFiles(pullRequestFiles);

console.log("REVIEWABLE FILES:", reviewableFiles.length);

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

console.log("TRANSFORMED FILES:", transformedFiles.length);


const prompt = buildReviewPrompt(reviewContext, transformedFiles);
console.log("PROMPT BUILT:", prompt.length);
const aiResponse = await generateReview(prompt, review.aiModel);


console.log("AI REVIEW GENERATED:", {
    score: aiResponse.score,
    findings: aiResponse.findings.length,
});

console.log("SAVING AI REVIEW RESULT...");

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

console.log("REVIEW RESULT SAVED:", reviewResult.id);


await prisma.reviewFinding.createMany({
    data: aiResponse.findings.map((finding) => ({
        reviewResultId: reviewResult.id,
        severity: finding.severity,
        file: finding.file,
        line: finding.line,
        category: finding.category,
        message: finding.message,
        suggestion: finding.suggestion,
    })),
});

console.log("REVIEW FINDINGS SAVED:", aiResponse.findings.length);

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

console.log("REVIEW COMPLETED:", {
    reviewId,
    durationMs,
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





export async function startReview(request, context) {
    const user = await requireUser();

    console.log("START REVIEW USER:", user.id);

     const { owner, repo, pullNumber } = await context.params;

    console.log("START REVIEW PR:", {
        owner,
        repo,
        pullNumber,
    });
}