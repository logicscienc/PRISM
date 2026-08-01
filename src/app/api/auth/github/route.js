import {loginWithGithub} from "@/controllers/auth.controller";

// Handles GET requests to start the GitHub OAuth flow
export async function GET() {
    return loginWithGithub();
}