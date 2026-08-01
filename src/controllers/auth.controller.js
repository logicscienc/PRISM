import {cookies} from 'next/headers';
import { redirect } from "next/navigation";
// Starts GitHub OAuth login
export async function loginWithGithub() {
     // Generate a secure random value to protect the OAuth flow. crypto is a built-in module provided by Node.js. It's not only for generating random strings.It can also Generate secure random values, Create hashes (SHA-256, SHA-512), Encrypt data, Decrypt data, Generate UUIDs,Verify digital signatures. And also we might think why we didn't import it from 'crypto' at the top of the file. The reason is that Next.js provides the Web Crypto API globally in route handlers and server environments. And now comes why randomUUID() is used, Since OAuth is a security feature, we always choose the secure option. and it provide random, extremely difficult to guess and is designed for security.
    const state = crypto.randomUUID();

        // Get the cookie manager provided by Next.js. As we know, Cookies are small pieces of data stored in the browser. and we are using await because in next.js cookies() is asynchronous. but why we are storing it in a variable called cookieStore, because we will use it to set the things later. cookieStore is an object that gives me methods to manage cookies.

    const cookieStore = await cookies();


 // Store the generated state in a secure HTTP-only cookie. this line says Create a cookie named oauth_state, store the value inside state, and configure how this cookie should behave. 
    cookieStore.set("oauth_state", state, {
      // we set it as true because we want JavaScript running in the browser cannot read this cookie Only the browser and the server can use it.This protects us from many attacks.
          httpOnly: true,
          // The browser will only send this cookie over HTTPS. It's that the browser refuses to send it over plain HTTP.
  secure: process.env.NODE_ENV === "production",
  // Protects against many cross-site request forgery (CSRF) attacks
// while still allowing normal navigation back from GitHub.
  sameSite: "lax",
  maxAge: 60 * 10, // 10 minutes
  // This cookie belongs to the whole website.
  path: "/",
    });
   // Read the GitHub OAuth configuration from environment variables.
    const clientId = process.env.GITHUB_CLIENT_ID;
     const callbackUrl = process.env.GITHUB_CALLBACK_URL;

     if (!clientId || !callbackUrl) {
  throw new Error("GitHub OAuth environment variables are missing.");
}
    

  // Create a URL object instead of manually concatenating strings.
// This makes adding query parameters cleaner and less error-prone.
    const githubUrl = new URL("https://github.com/login/oauth/authorize");

// the code below shows query parameters, They are simply key-value pairs appended to the end of a URL after the ?. 
    githubUrl.searchParams.set("client_id", clientId);
    githubUrl.searchParams.set("redirect_uri", callbackUrl);
    githubUrl.searchParams.set("state", state);
     githubUrl.searchParams.set("scope", "read:user user:email");

      // Redirect the user to GitHub
    redirect(githubUrl.toString());
}

// Handles GitHub callback after successful login. why we are using redirect here because after the user is authenticated by Github, we want to redirect them back to our application. 
export async function githubCallback(request) {
  // now let's think what did github send us back, it sends us back a code and state. 

  const code = request.nextUrl.searchParams.get("code");
const state = request.nextUrl.searchParams.get("state");

// now we need our originally generated state to compare it with the state we received from github. If they match, it means the request is legitimate and not a CSRF attack. If they don't match, we should rejact it. 
  const cookieStore = await cookies();

    const storedState = cookieStore.get("oauth_state")?.value;

    // validate the data before comparing
    if (!code || !state || !storedState) {
    throw new Error("Invalid OAuth callback.");
}

if(state !== storedState) {
   throw new Error("Invalid OAuth state.");
}

// now once the state match: we will delete the state cookie because that state has already been used.
cookieStore.delete("oauth_state");

// exchange the code for an access token. This is a server-to-server request, so we don't expose our client secret to the browser. We use fetch to make a POST request to GitHub's token endpoint. We send the client id, client secret, code and redirect uri in the request body. Github will respond with an access token if everything is valid.

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const callbackUrl = process.env.GITHUB_CALLBACK_URL;

const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
        method: "POST",
        // as all api reuest must have headers and payload/body so what this below headers does, this header is us telling GitHub Please send your response in JSON format. without it github may return a plan text. 
        headers: {
            Accept: "application/json",
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: callbackUrl,
        }),
    }
);

if (!response.ok) {
    throw new Error("Failed to get GitHub access token.");
}

// now ones we know github replied successfully, we open the package
// 1. Interview question why do we write await response.json()?
// Ans 1. fetch() returns the complete HTTP response, not just the response body. The body is still in a raw format. Calling response.json() reads the body stream and converts the JSON returned by the server into a JavaScript object so we can access fields like access_token. 
const tokenData = await response.json();
const accessToken = tokenData.access_token;


const profileResponse = await fetch(
  "https://api.github.com/user",
  {
    method: "GET",

    headers: {
       Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    }
  }
)

if(!profileResponse.ok)
{
   throw new Error("Failed to fetch GitHub user profile.");
}

const profileData = await profileResponse.json();
// now check in the db is the user already exist or not
let user = await prisma.user.findUnique({
    where: {
        githubUserId: String(profileData.id),
    },
});

// if this above code return null that mean user does not exist and we need to create new user
if (!user) {
  user = await prisma.user.create({
    data: {
      githubUserId: String(profileData.id),
      login: profileData.login,
      name: profileData.name,
      email: profileData.email,
      avatarUrl: profileData.avatar_url,
    },
  });
}

}

// Returns the currently authenticated user
export async function getCurrentUser() {

}

// Logs the user out
export async function logout() {

}