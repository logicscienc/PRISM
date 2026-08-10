export function buildReviewPrompt(reviewContext, transformedFiles) {

    const { title, description, author } = reviewContext;

// It's used to convert the array of changed files into one clean piece of text that we can put inside the AI prompt. The AI doesn't need to receive this as a JavaScript array in our prompt. We want to create readable text. 
    const filesSection = transformedFiles
    // .map((file) this map means it go through every file in the array, one at a time, 
    .map((file) => {
        return `
File: ${file.filename}
Status: ${file.status}
Additions: ${file.additions}
Deletions: ${file.deletions}
Changes: ${file.changes}

Patch:
${file.patch ?? "No patch available."}
`;
    })
    .join("\n");

   const prompt = `
You are an expert software engineer performing a code review.

## Pull Request

Title: ${title}
Author: ${author}

Description:
${description}

## Changed Files

${filesSection}

## Review Instructions

Review the Pull Request carefully.

Look for:

- Bugs and incorrect logic
- Security vulnerabilities
- Performance problems
- Missing error handling
- Edge cases
- Potential race conditions
- Code quality issues
- Maintainability problems
- Incorrect API or database usage
- Best-practice violations

Focus on issues that could have a meaningful impact on the application.

Do not report minor formatting or stylistic preferences unless they affect correctness or maintainability.
`; 

return prompt;



}