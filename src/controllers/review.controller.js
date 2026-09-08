import { ReviewStatus } from "../generated/prisma/enums.ts";
import { getGithubAccessToken } from "../lib/github-auth.js";
import { processReview } from "./reviewProcessor.controller.js";
import { requireUser } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
// createReview() : Starts a new AI code review
export async function createReview(request) {
    // Authenticating the user
    const user = await requireUser();

if (!user.githubAccessToken) {
    throw new Error("GitHub access token not found.");
}

//    read the request body
const { owner, repo, pullNumber } = await request.json();

// validate

if (!owner || !repo || !pullNumber) {
    throw new Error("Repository owner, name or pull number is missing.");
}

//  we need githubId and we'll fetch it from Github 
const repositoryResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: "application/json",
        },
    }
);
if (!repositoryResponse.ok) {
    throw new Error("Failed to fetch GitHub repository.");
}

const repository = await repositoryResponse.json();

if (!repository || typeof repository !== "object") {
    throw new Error("Invalid repository response from GitHub.");
}

const githubRepoId = String(repository.id);




const review = await prisma.review.create({
    data: {
        userId: user.id,
        githubRepoId,
        owner,
        repo,
        prNumber,
        status: ReviewStatus.QUEUED,
        aiModel: "gpt-5",
    },
});

// Start the background AI review process.
// The review has already been created with status QUEUED.
// processReview(review.id) will:
// 1. Update the review to PROCESSING
// 2. Fetch Pull Request details
// 3. Fetch changed files
// 4. Filter unnecessary files
// 5. Build the AI prompt
// 6. Call the AI model
// 7. Save the review results
// 8. Update the review status to COMPLETED or FAILED
processReview(review.id);






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

    const accessToken = await getGithubAccessToken(user.id);

if (!accessToken) {
    throw new Error("GitHub access token is invalid or unavailable.");
}

    const repositoryResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
        },
    }
);

if (!repositoryResponse.ok) {
    throw new Error("Failed to fetch GitHub repository.");
}

const repository = await repositoryResponse.json();

const githubRepoId = String(repository.id);

console.log("GITHUB REPO ID:", githubRepoId);


const review = await prisma.review.create({
    data: {
        userId: user.id,
        githubRepoId,
        owner,
        repo,
        prNumber: Number(pullNumber),
        status: ReviewStatus.QUEUED,
        aiModel: "gpt-5",
    },
});

console.log("REVIEW FOUND:", review?.id, review?.status);

console.log("REVIEW CREATED:", review.id);

processReview(review.id);

     return Response.json({
        success: true,
        message: "Review started.",
    });
}




// getReview()
export async function getReview(request, context) {
    const user = await requireUser();

    const { owner, repo, pullNumber } = await context.params;

    const review = await prisma.review.findFirst({
        where: {
            userId: user.id,
            owner,
            repo,
            prNumber: Number(pullNumber),
        },
        include: {
            reviewResult: {
                include: {
                    findings: true,
                },
            },
        },
         orderBy: {
        createdAt: "desc",
    },
    });

    if (!review) {
        return Response.json(
            {
                success: false,
                message: "Review not found.",
            },
            { status: 404 }
        );
    }

    return Response.json({
        success: true,
        data: review,
    });
}

// getReviews()
// deleteReview()
