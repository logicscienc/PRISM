import { z } from "zod";

const findingSchema = z.object({
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  category: z.enum(["SECURITY","PERFORMANCE","CODE_QUALITY","EDGE_CASE","BEST_PRACTICE"]),
  file: z.string().min(1),
  startLine: z.number().int().positive().nullable(),
  endLine: z.number().int().positive().nullable(),
  title: z.string().min(1),          // short, shown as the card heading
  message: z.string().min(1),        // what is wrong and why
  suggestedCode: z.string().nullable(), // fixed code, ready to copy
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