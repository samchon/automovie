/**
 * Explain the authoring work between a blank harness and a runnable production.
 *
 * `directory` is printed as given (run passes the absolute target). The text
 * starts with a blank line because run appends it to the written-file list, and
 * it names scaffold files (`README.md`, `AGENTS.md`, `docs/README.md`,
 * `lint.config.ts`) and the scaffold's `lint` and `evidence` scripts.
 *
 * @evidence contracts/common.md#principled-implementation A template literal of ordered steps whose file and script names match `packages/template/scaffold` at the time of writing: its root documents, `lint.config.ts`, and the `lint` and `evidence` package scripts.
 * @evidence contracts/common.md#clear-and-simple-design A pure string function kept apart from `run` so the guidance text lives in one place; nothing ties its file and script names to the scaffold mechanically, so renaming a scaffold file or script would leave this text stale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no particular production, language or kind; the caller's directory is the only varying input.
 * @evidence contracts/common.md#meaningful-documentation States how the directory is printed, why the text opens with a blank line, and which scaffold files and scripts the steps depend on.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Concatenates fixed text around one directory string; there is no algorithm or structure to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work `start` calls it once after a completed publication, so there is no repeated rendering to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one string of fixed length plus the directory's length and keeps no reference to it.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation Prints the directory for display only and opens, compares or spawns nothing; the printed `npm` commands read the same in cmd, PowerShell and POSIX shells.
 */
export const renderAutoMovieScaffoldNextSteps = (directory: string): string =>
  `\n\nNext (from ${directory}):\n` +
  `  1. Read README.md, AGENTS.md, and docs/README.md. This is an empty harness.\n` +
  `  2. Run npm install --package-lock=false.\n` +
  `  3. Select film, brief, or library and its active branches in lint.config.ts.\n` +
  `  4. Author and review the required docs, then their TypeScript source under src.\n` +
  `  5. Run npm run lint for source and npm run evidence for authored evidence.\n\n` +
  `A blank project contains no production content. Author the selected shape with the public AutoMovie package APIs.\n` +
  `Add project-specific source under src and browser assets under public only when the requested work needs them.\n`;
