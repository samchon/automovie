/**
 * Explain the authoring work between a blank harness and a runnable production.
 *
 * `directory` is printed as given (`run` passes the absolute target). The text
 * starts with a blank line because `run` appends it to the written-file list,
 * and it names the scaffold's `README.md` and `AGENTS.md` and its `lint` and
 * `evidence` scripts.
 */
export function renderAutoMovieScaffoldNextSteps(directory: string): string {
  return (
    `\n\nNext (from ${directory}):\n` +
    `  1. Read README.md and AGENTS.md. This is an empty harness.\n` +
    `  2. Run npm install --package-lock=false.\n` +
    `  3. Author the production in TypeScript under src with the public AutoMovie package APIs.\n` +
    `  4. Run npm run lint for source and npm run evidence for checklist answers.\n`
  );
}
