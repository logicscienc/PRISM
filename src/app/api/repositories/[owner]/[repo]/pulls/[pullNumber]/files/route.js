import { getPullRequestFiles } from "@/controllers/pullRequest.controller";

export async function GET(request, context) {
    return getPullRequestFiles(request, context);
}