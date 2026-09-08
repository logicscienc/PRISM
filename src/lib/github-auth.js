import { prisma } from "./prisma.js";
import { decryptToken } from "./encryption.js";
import { validateGithubToken } from "./github.js";

export async function getGithubAccessToken(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user || !user.githubAccessToken) {
    return null;
  }

  const accessToken = decryptToken(user.githubAccessToken);

  const isValid = await validateGithubToken(accessToken);

  if (!isValid) {
    return null;
  }

  return accessToken;
}