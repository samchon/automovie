/**
 * Explain the authoring work between a blank harness and a runnable production.
 *
 * `directory` is printed as given (`run` passes the absolute target). The text starts with a blank line because `run` appends it to the written-file list, and it names the scaffold's `README.md` and `AGENTS.md` and its `lint` and `evidence` scripts, so it must change with the scaffold's `package.json` scripts and first-run README section.
 *
 * @evidence contracts/common.md#principled-implementation The steps are fixed text derived from the scaffold's own first-run contract: its README's `npm install --package-lock=false`, `npm run lint` and `npm run evidence` commands and its `lint` and `evidence` scripts; only the directory varies, and it is interpolated verbatim because it is display text, not a shell argument.
 * @evidence contracts/common.md#clear-and-simple-design One pure function returns the text and leaves writing to `run`, so the message has a single owner and no template or option layer for one variable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The text names no fixture or particular directory and is not altered by any caller; the scaffold commands it repeats are the template's contract-defined first-run steps.
 * @evidence contracts/common.md#meaningful-documentation The comment states how `directory` is printed and what `run` passes, why the text opens with a blank line, and which scaffold files and scripts it names and so must track.
 * @evidence contracts/performance.md#efficient-algorithms The result is one concatenation of five constant lines with one interpolation, linear in the directory's length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work `run` calls this once per successful scaffold, so no equivalent result is requested twice.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function returns a new string and holds no state, handle, or task after it returns.
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
