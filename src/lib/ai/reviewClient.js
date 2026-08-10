import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { reviewResponseSchema } from "../review/reviewResponseSchema.js";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReview(prompt, model) {
    // Call OpenAI
   const response = await openai.responses.parse({
    model,
    input: prompt,
     text: {
        format: zodTextFormat(reviewResponseSchema, "review"),
    },
});

    // Extract the actual AI-generated text.
    const aiResponse = response.output_parsed;

    // Validate the AI response
    if (!aiResponse) {
        throw new Error("AI returned an empty response.");
    }

    return aiResponse;
}