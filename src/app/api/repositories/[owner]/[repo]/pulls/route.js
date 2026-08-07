import { getPullRequests } from "@/controllers/pullRequest.controller";

export async function GET(request, context) {
    return getPullRequests(request, context);
}