import { getRepositories } from "@/controllers/repository.controller";

export async function GET(request) {
    return getRepositories(request);
}