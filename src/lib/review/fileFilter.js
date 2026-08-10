const SKIPPED_EXTENSIONS = [
     ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".svg",
    ".mp4",
    ".mov",
    ".mp3",
    ".wav",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".exe",
    ".dll",
    
];

const SKIPPED_FILENAMES = [
    "package-lock.json",
    "pnpm-lock.yaml",
    "bun.lock",
    "yarn.lock",
    "composer.lock",
    "Cargo.lock",
    
];

const SKIPPED_DIRECTORIES = [
    "dist/",
    "build/",
    "coverage/",
    ".next/",
    "out/",
    
];

export function filterReviewableFiles(files) {


     return files.filter((file) => {
         const filename = file.filename;

         // Skip files with skipped extensions
if (SKIPPED_EXTENSIONS.some((ext) => filename.endsWith(ext))) {
    return false;
}

// Skip files with skipped names
if (SKIPPED_FILENAMES.includes(filename)) {
    return false;
}

// Skip files in skipped directories
if (SKIPPED_DIRECTORIES.some((dir) => filename.startsWith(dir))) {
    return false;
}

  // Skip minified files
        if (
            filename.endsWith(".min.js") ||
            filename.endsWith(".min.css")
        ) {
            return false;
        }

return true;
     });

}