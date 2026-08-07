import { getPullRequest } from "@/controllers/pullRequest.controller";

export async function GET(request, context) {
    return getPullRequest(request, context);
}