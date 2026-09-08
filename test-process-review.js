import { prisma } from "./src/lib/prisma.js";
import { processReview } from "./src/controllers/reviewProcessor.controller.js";

const OWNER = "logicscienc";
const REPO = "CaramelCorner";
const PR_NUMBER = 2;

async function main() {
    console.log("Starting processReview integration test...");

   const user = await prisma.user.findUnique({
    where: {
        login: "logicscienc",
    },
});

    if (!user) {
        throw new Error(
            "No user with a GitHub access token was found in the database."
        );
    }

    console.log(`Using GitHub user: ${user.login}`);

    const review = await prisma.review.create({
        data: {
            userId: user.id,
            githubRepoId: "integration-test",
            owner: OWNER,
            repo: REPO,
            prNumber: PR_NUMBER,
            aiModel: "gpt-5",
            status: "QUEUED",
        },
    });

    console.log(`Created review: ${review.id}`);

    try {
        await processReview(review.id);

        const result = await prisma.review.findUnique({
            where: {
                id: review.id,
            },
            include: {
                reviewResult: true,
            },
        });

        console.log("\n===== REVIEW =====");
        console.dir(result, { depth: null });

       const findings = await prisma.reviewFinding.findMany({
    where: {
        reviewResultId: result.reviewResult.id,
    },
});

        console.log("\n===== FINDINGS =====");
        console.dir(findings, { depth: null });

    } catch (error) {
        console.error("\nprocessReview failed:");
        console.error(error);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });