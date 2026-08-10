import { ReviewStatus } from "../generated/prisma";
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










//  getReview()
// getReviews()
// deleteReview()
