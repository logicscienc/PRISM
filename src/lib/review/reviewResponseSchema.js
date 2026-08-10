import { z } from "zod";

const findingSchema = z.object({
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
    file: z.string(),
    line: z.number().nullable(),
    category: z.enum([
        "SECURITY",
        "PERFORMANCE",
        "CODE_QUALITY",
        "EDGE_CASE",
        "BEST_PRACTICE",
    ]),
    message: z.string(),
    suggestion: z.string().nullable(),
});


// A valid AI review must contain the overall review and an array of individual findings.
const reviewResponseSchema = z.object({
    score: z.number().int().min(0).max(100),

    summary: z.string(),

    security: z.string(),

    performance: z.string(),

    codeQuality: z.string(),

    edgeCases: z.string(),

    bestPractices: z.string(),

    findings: z.array(findingSchema),
});

export { reviewResponseSchema };