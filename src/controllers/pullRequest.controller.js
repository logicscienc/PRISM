// getPullRequests() : 


// so we are using request here because this is a controller that handles an HTTP request. The controller receives the entire request object and extracts whatever it needs from it.
export async function getPullRequests(request, context) {

    // because every GitHub API call requires an authenticated user.
    const user = await requireUser();


    if (!user.githubAccessToken) {
        throw new Error("GitHub access token not found.");
    }

    const { owner, repo } = await context.params;

    if (!owner || !repo) {
    throw new Error("Repository owner or name is missing.");
}

const pullRequestsResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?page=1&per_page=20`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: "application/json",
        },
    }
);

 if (!pullRequestsResponse.ok) {
    throw new Error("Failed to fetch GitHub pull requests.");
} 

const pullRequests = await pullRequestsResponse.json();

if (!Array.isArray(pullRequests)) {
    throw new Error("Invalid pull requests response from GitHub.");
}

// now we are instead of pullRequests, it is an array of pull request objects, each object contains 100+ fields, but our PRISM app should not return GitHub's entire response. Insted, it should return only the fields the frontend needs.

const transformedPullRequests = pullRequests.map((pr) => {
    return {
        // choose only the fields PRISM needs
        id: pr.id,
        number: pr.number,
        title: pr.title,
        author: pr.user.login,
        state: pr.state,
        createdAt: pr.created_at,
        htmlUrl: pr.html_url,
          headBranch: pr.head.ref,
        baseBranch: pr.base.ref,

    };
});

return Response.json({
    success: true,
    data: transformedPullRequests,
});


}
// getPullRequest() : Returns one specific pull request.
export async function getPullRequest(request, context) {
    const user = await requireUser();

    if (!user.githubAccessToken) {
    throw new Error("GitHub access token not found.");
}

  const {owner, repo, pullNumber} = await context.params;
  if(!owner || !repo || !pullNumber){
    throw new Error("Repository owner, name or pull number is missing.");
  }


  const pullRequestResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: "application/json",
        },
    }
);

 if (!pullRequestResponse.ok) {
    throw new Error("Failed to fetch GitHub pull request.");
} 

const pullRequest = await pullRequestResponse.json();

if (!pullRequest || typeof pullRequest !== "object") {
    throw new Error("Invalid pull request response from GitHub.");
}

const transformedPullRequest = {
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    description: pullRequest.body,
    author: pullRequest.user.login,
    state: pullRequest.state,
    createdAt: pullRequest.created_at,
    updatedAt: pullRequest.updated_at,
    merged: pullRequest.merged,
    mergeable: pullRequest.mergeable,
    headBranch: pullRequest.head.ref,
    baseBranch: pullRequest.base.ref,
    changedFiles: pullRequest.changed_files,
    commits: pullRequest.commits,
    additions: pullRequest.additions,
    deletions: pullRequest.deletions,
    htmlUrl: pullRequest.html_url,
};

return Response.json({
    success: true,
    data: transformedPullRequest,
});

}











// getPullRequestFiles():This is actually one of the most important controllers because it feeds the AI.


export async function getPullRequestFiles(request, context) {
    const user = await requireUser();

if (!user.githubAccessToken) {
    throw new Error("GitHub access token not found.");
}

const { owner, repo, pullNumber } = await context.params;

if (!owner || !repo || !pullNumber) {
    throw new Error("Repository owner, name or pull number is missing.");
}


const pullRequestFilesResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: "application/json",
        },
    }
);

if (!pullRequestFilesResponse.ok) {
    throw new Error("Failed to fetch GitHub pull request files.");
}

const pullRequestFiles = await pullRequestFilesResponse.json();


if (!Array.isArray(pullRequestFiles)) {
    throw new Error("Invalid pull request files response from GitHub.");
}

const transformedPullRequestFiles = pullRequestFiles.map((file) => {
    return {
        sha: file.sha,  //identifies the exact file version.
        filename: file.filename, //tells the AI which file changed
        status: file.status, //added, modified, removed, renamed.
        additions: file.additions, //number of added lines
        deletions: file.deletions, //number of removed lines
        changes: file.changes, //total changed lines
        patch: file.patch ?? null, //the actual code diff, This is the most important field because the AI reviews this.
    };
});


return Response.json({
    success: true,
    data: transformedPullRequestFiles,
});



}    