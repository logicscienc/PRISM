import { requireUser } from "@/lib/auth";
import { getGithubAccessToken } from "@/lib/github-auth";

// getRepositories()
export async function getRepositories() {
    // since this endpoint requires authentication, we are using requireUser() as this endpoint must have a logged-in user. If someone isn't authenticated, we don't want to return null; we want them to be redirected to login.
    const user = await requireUser();


   const accessToken = await getGithubAccessToken(user.id);

if (!accessToken) {
    throw new Error("GitHub connection is invalid. Please reconnect GitHub.");
}

    const repositoriesResponse = await fetch(
        "https://api.github.com/user/repos?sort=updated&direction=desc&per_page=100",

        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                 Accept: "application/json",
            }
        }
    )

   if (!repositoriesResponse.ok) {
    throw new Error("Failed to fetch GitHub repositories.");
} 

const repositories = await repositoriesResponse.json();

if (!Array.isArray(repositories)) {
    throw new Error("Invalid repositories response from GitHub.");
}

// now we are inside repositories, it is an array of repository objects, each object contains 100+ fields, but our PRISM app should not return Github's entire response. Instead, it should return only the fields the frontend needs. 

const transformedRepositories = repositories.map((repo) => {
    return {
        id: repo.id,
        name: repo.name,
        owner: repo.owner.login,
        visibility: repo.private ? "private" : "public",
        language: repo.language,
        updatedAt: repo.updated_at,
    };
});

return Response.json({
    success: true,
    data: transformedRepositories,
});

}





// getRepository()