// Publish ./dist to the gh-pages branch by hand.
//
// `.github/workflows/website.yml` does the same on every push to master; this
// script is the manual route for publishing a build from the current checkout.
// Run `pnpm run deploy` so the build precedes the publish.
import ghpages from "gh-pages";
import path from "node:path";

const root = path.resolve(__dirname, "..");

console.log("[deploy] publishing ./dist to gh-pages...");
const publication = ghpages.publish(
  path.join(root, "dist"),
  {
    branch: "gh-pages",
    dotfiles: true,
    // One commit on gh-pages, as the workflow keeps it; a snapshot history of
    // a 20 MB texture set would only bloat the repository.
    history: false,
    message: "Update automovie website",
  },
  (error: Error | null | undefined) => {
    if (error) {
      console.error("[deploy] FAILED:", error);
      process.exit(1);
    }
    console.log("[deploy] done.");
  },
);

// The callback remains the publisher's completion owner. The dependency also
// returns a promise on normal publication paths; handle its rejection rather
// than leaving a second asynchronous failure channel unobserved.
publication?.catch((error: unknown) => {
  console.error("[deploy] FAILED:", error);
  process.exitCode = 1;
});
