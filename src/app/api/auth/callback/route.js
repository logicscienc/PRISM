import { githubCallback } from "@/controllers/auth.controller";



// Handles GitHub's redirect after the user authorizes the application.
export async function GET(request) {
    return githubCallback(request);
}