import { requireUser } from "@/lib/auth";
import PullRequest from "@/app/components/dashboard/PullRequest";

export default async function PullRequestPage({ params }) {
  await requireUser();

  const { owner, repo, pullNumber } = await params;

  return (
    <PullRequest
      owner={owner}
      repo={repo}
      pullNumber={pullNumber}
    />
  );
}