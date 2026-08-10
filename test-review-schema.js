import { reviewResponseSchema } from "./src/lib/review/reviewResponseSchema.js";

const testReview = {
    score: 82,
    summary: "The PR is mostly solid.",
    security: "One security issue was found.",
    performance: "No major performance issues.",
    codeQuality: "Code is generally readable.",
    edgeCases: "One edge case is not handled.",
    bestPractices: "Error handling could be improved.",
    findings: [
        {
            severity: "HIGH",
            file: "src/auth/login.js",
            line: 42,
            category: "SECURITY",
            message: "User-controlled input is not validated.",
            suggestion: "Validate the input before processing it.",
        },
    ],
};

const result = reviewResponseSchema.safeParse(testReview);

console.log("Validation successful:", result.success);

if (result.success) {
    console.log("Validated review:");
    console.dir(result.data, { depth: null });
} else {
    console.error("Validation failed:");
    console.error(result.error);
}