import { requireUser } from "@/lib/auth";
import Repository from "@/app/components/dashboard/Repository";

export default async function RepositoryPage({ params }) {
  await requireUser();

  const { owner, repo } = await params;

  return (
    <Repository
      owner={owner}
      repo={repo}
    />
  );
}