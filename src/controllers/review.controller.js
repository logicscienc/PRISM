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






}










//  getReview()
// getReviews()
// deleteReview()
