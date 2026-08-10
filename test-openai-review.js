import "dotenv/config";
import { generateReview } from "./src/lib/ai/reviewClient.js";

const prompt = `
You are reviewing a pull request.

Review this code:

File: src/auth/login.js
Status: modified
Additions: 5
Deletions: 2

Patch:
@@ -10,5 +10,8 @@
 function getUser(id) {
+    const query = "SELECT * FROM users WHERE id = " + id;
+    return db.query(query);
 }

Return a structured code review.
Identify any security, performance, code quality, edge case, or best-practice issues.
For every finding, provide the file and line number.
`;

const result = await generateReview(prompt, "gpt-5");

console.dir(result, { depth: null });