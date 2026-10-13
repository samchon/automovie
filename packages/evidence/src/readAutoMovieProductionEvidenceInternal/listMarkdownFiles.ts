import { walkAutoMovieProjectPopulationFiles } from "../walkAutoMovieProjectPopulationFiles";


/** List one already-validated Markdown population without leaving its root.
 *
 * @evidence contracts/common.md#principled-implementation The controlled population walker enumerates only project-local Markdown files below the supplied owner root.
 * @evidence contracts/common.md#clear-and-simple-design A thin private reader boundary fixes the extension while shared physical admission remains in the walker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No direct glob or symlink-following fallback bypasses population identity.
 * @evidence contracts/common.md#meaningful-documentation The comment states an already validated owner population and retained project root.
 * @evidence contracts/performance.md#efficient-algorithms Cost is the full walk and sorting of its files; delegation does not remove traversal or unbounded inventory storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical walker is reused, while each reader call performs a new physical inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned path strings transfer to the reader; this helper owns no persistent handle or cache.
 */
export const listMarkdownFiles: (projectRoot: string, root: string) => string[] = (projectRoot: string, root: string): string[] =>
  walkAutoMovieProjectPopulationFiles(projectRoot, root, ".md");
