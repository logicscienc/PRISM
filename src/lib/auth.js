// getCurrentUser() : return the currentley authenticated user.
export async function getCurrentUser() {
// we first need the cookie manager because cookies() gives us access to all cookies sent by the browser. cookieStore is an object that lets us read, set, and delete cookies.
    const cookieStore = await cookies();

    // now we need to read the sesssion cookie, cookieStore.get("session_id") this line says that Find the cookie named session_id.

    const sessionId = cookieStore.get("session_id")?.value;

    // if the sessionId is not found, it means The user has never logged in or the user logged out or the cookie expired or the user manually deleted the cookie.

      if (!sessionId) {
        return null;
    }

    // now we need to find the session in the database. 
    const session = await prisma.session.findUnique({
    where: {
        sessionId,
    },
});

// If no session is found, the session is invalid.
// It may have been deleted, never existed, or the cookie may be fake or outdated.

if (!session) {
    return null;
}

// next check whether the session has expired
if (session.expiresAt < new Date()) {
     await prisma.session.delete({
        where: {
            sessionId,
        },
    });
    return null;
}

// if the session is valid, we can now find the user in the db
const user = await prisma.user.findUnique({
    where: {
        id: session.userId,
    },
});

if (!user) {
    return null;
}

return user;
}

// requireUser(): so why we need this function? Because we want to make sure that the user is authenticated before they can access certain pages or perform certain actions. If the user is not authenticated, we will redirect them to the login page.
export async function requireUser() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return user;
}

// logout(): we just want PRISM to forget this session. We don't delete the user. The user account stays forever.We're only deleting one login session.
export async function logout() {
    // we need to get the cookie manager Because we need to read and delete the cookie.

    const cookieStore = await cookies();

      // Read the current session ID stored in the browser.
    const sessionId = cookieStore.get("session_id")?.value;

    // If no session cookie exists, the user is already logged out.
    if (!sessionId) {
        return;
    }

    // we will first delete the session from the db because If we deleted the cookie first, the browser would forget the session, but the database would still contain an active session.
   await prisma.session.deleteMany({
    where: {
        sessionId,
    },
});

cookieStore.delete("session_id");
redirect("/login");




}

