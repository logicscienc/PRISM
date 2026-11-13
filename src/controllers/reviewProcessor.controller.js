import { prisma } from "../lib/prisma.js";
import { ReviewStatus } from "../generated/prisma/enums.ts";
import { filterReviewableFiles } from "../lib/review/fileFilter.js";
import { buildReviewPrompt } from "../lib/review/promptBuilder.js";
import { generateReview } from "../lib/ai/reviewClient.js";
import { getGithubAccessToken } from "../lib/github-auth.js";
import { validateFindings } from "../lib/review/validateFindings.js";

const GITHUB_HEADERS = (accessToken) => ({
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
});

export async function processReview(reviewId) {
    console.log("PROCESS REVIEW STARTED:", reviewId);

    // Fetch the review from the database.
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    // processReview runs in the background (not awaited), so we log and return
    // here instead of throwing. A throw would become an unhandled rejection.
    if (!review) {
        console.error("Review not found:", reviewId);
        return;
    }

    const startedAt = new Date();

    await prisma.review.update({
        where: { id: reviewId },
        data: {
            status: ReviewStatus.PROCESSING,
            startedAt,
        },
    });

    console.log("REVIEW STATUS SET TO PROCESSING:", reviewId);

    try {
        // Fetch the user who started the review.
        const user = await prisma.user.findUnique({
            where: { id: review.userId },
        });

        if (!user) {
            throw new Error("User not found.");
        }

        // Get the decrypted and validated GitHub access token through the helper,
        // so this controller never handles the encrypted token directly.
        const accessToken = await getGithubAccessToken(user.id);

        if (!accessToken) {
            throw new Error("GitHub access token is invalid or unavailable.");
        }

        // 1. Fetch the pull request.
        const pullRequestResponse = await fetch(
            `https://api.github.com/repos/${review.owner}/${review.repo}/pulls/${review.prNumber}`,
            {
                method: "GET",
                headers: GITHUB_HEADERS(accessToken),
            }
        );

        if (!pullRequestResponse.ok) {
            const errorBody = await pullRequestResponse.text();

            console.error("GitHub PR fetch failed:");
            console.error("Status:", pullRequestResponse.status);
            console.error("Response:", errorBody);

            throw new Error(
                `Failed to fetch GitHub pull request: ${pullRequestResponse.status}`
            );
        }

        const pullRequest = await pullRequestResponse.json();

        if (!pullRequest || typeof pullRequest !== "object") {
            throw new Error("Invalid pull request response from GitHub.");
        }

        console.log("GITHUB PR FETCHED:", {
            number: pullRequest.number,
            title: pullRequest.title,
        });

        // The context the AI needs to understand what the PR is trying to do.
        const reviewContext = {
            title: pullRequest.title,
            description: pullRequest.body ?? "",
            author: pullRequest.user.login,
        };

        // 2. Fetch the changed files.
        const pullRequestFilesResponse = await fetch(
            `https://api.github.com/repos/${review.owner}/${review.repo}/pulls/${review.prNumber}/files`,
            {
                method: "GET",
                headers: GITHUB_HEADERS(accessToken),
            }
        );

        if (!pullRequestFilesResponse.ok) {
            throw new Error("Failed to fetch GitHub pull request files.");
        }

        const pullRequestFiles = await pullRequestFilesResponse.json();

        if (!Array.isArray(pullRequestFiles)) {
            throw new Error("Invalid pull request files response from GitHub.");
        }

        console.log("GITHUB PR FILES FETCHED:", pullRequestFiles.length);

        // 3. Filter out files that are not worth reviewing (lockfiles, images, build output...).
        const reviewableFiles = filterReviewableFiles(pullRequestFiles);

        console.log("REVIEWABLE FILES:", reviewableFiles.length);

        const transformedFiles = reviewableFiles.map((file) => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            patch: file.patch ?? null,
        }));

        console.log("TRANSFORMED FILES:", transformedFiles.length);

        // Nothing to review: fail clearly instead of asking the AI to invent issues.
        if (transformedFiles.length === 0) {
            throw new Error("No reviewable files in this pull request.");
        }

        // 4. Build the prompt and call the AI.
        const prompt = buildReviewPrompt(reviewContext, transformedFiles);
        console.log("PROMPT BUILT:", prompt.length);

        const aiResponse = await generateReview(prompt, review.aiModel);

        // 5. Check the AI's line numbers against the real diff.
        aiResponse.findings = validateFindings(
            aiResponse.findings,
            transformedFiles
        );

        console.log("AI REVIEW GENERATED:", {
            score: aiResponse.score,
            findings: aiResponse.findings.length,
        });

        // 6. Save the overall review result.
        console.log("SAVING AI REVIEW RESULT...");

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

        // 7. Save the individual findings.
        await prisma.reviewFinding.createMany({
            data: aiResponse.findings.map((finding) => ({
                reviewResultId: reviewResult.id,
                severity: finding.severity,
                file: finding.file,
                startLine: finding.startLine,
                endLine: finding.endLine,
                title: finding.title,
                category: finding.category,
                message: finding.message,
                suggestedCode: finding.suggestedCode,
            })),
        });

        console.log("REVIEW FINDINGS SAVED:", aiResponse.findings.length);

        // 8. Mark the review as completed.
        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();

        await prisma.review.update({
            where: { id: reviewId },
            data: {
                status: ReviewStatus.COMPLETED,
                completedAt,
                durationMs,
            },
        });

        console.log("REVIEW COMPLETED:", { reviewId, durationMs });
    } catch (error) {
        console.error("Error occurred while processing review:", error);

        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();

        // Save the failure. No `throw` afterwards: this function is not awaited,
        // so a rethrown error would crash the server as an unhandled rejection.
        try {
            await prisma.review.update({
                where: { id: reviewId },
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
        } catch (updateError) {
            console.error("Failed to save FAILED status:", updateError);
        }
    }
}




