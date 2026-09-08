import { startReview, getReview } from "@/controllers/review.controller";

export async function POST(request, context) {
    return startReview(request, context);
}

export async function GET(request, context) {
    return getReview(request, context);
}