import { z } from "zod";

const findingSchema = z.object({
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),

    file: z
        .string()
        .min(1, "Finding file cannot be empty"),

    line: z
        .number()
        .int()
        .positive()
        .nullable(),

    category: z.enum([
        "SECURITY",
        "PERFORMANCE",
        "CODE_QUALITY",
        "EDGE_CASE",
        "BEST_PRACTICE",
    ]),

    message: z
        .string()
        .min(1, "Finding message cannot be empty"),

    suggestion: z
        .string()
        .min(1, "Suggestion cannot be empty")
        .nullable(),
});

const reviewResponseSchema = z.object({
    score: z
        .number()
        .int()
        .min(0)
        .max(100),

    summary: z
        .string()
        .min(1, "Summary cannot be empty"),

    security: z
        .string()
        .min(1, "Security review cannot be empty"),

    performance: z
        .string()
        .min(1, "Performance review cannot be empty"),

    codeQuality: z
        .string()
        .min(1, "Code quality review cannot be empty"),

    edgeCases: z
        .string()
        .min(1, "Edge cases review cannot be empty"),

    bestPractices: z
        .string()
        .min(1, "Best practices review cannot be empty"),

    findings: z
        .array(findingSchema)
        .max(100, "Too many findings returned"),
});

export { reviewResponseSchema };