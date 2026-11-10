import type { IAutoMoviePackageManager } from "./IAutoMoviePackageManager";

/**
 * Explain the work between a freshly written installation and a runnable production.
 *
 * `directory` is printed as given (`run` passes the absolute target). The text starts with a blank line because `run` appends it to the written-file list. A `production` is a single production installed with `packageManager`'s manager: npm by default, pnpm at an enclosing workspace root when one is named; a `workspace` is a pnpm workspace root that still needs its first production; a `workspace-production` is a production added to such a root. The steps name the generated `README.md`, `AGENTS.md`, the `lint` and `evidence` scripts and the workspace's `add` command, so they must change with the scaffold's first-run README sections.
 *
 * @param directory The installed directory.
 * @param kind Which installation was written.
 * @param packageManager The manager a `production` installs with, from `selectAutoMoviePackageManager`; workspace kinds always use pnpm.
 * @returns The closing text.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The steps are fixed text derived from each layer's first-run contract: the production README's install and checks with the selected manager (npm by default, pnpm with its workspace root inside a pnpm workspace), and the workspace README's pnpm install and add.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure function returns the text for every installation kind and leaves writing to `run`, so the message has a single owner and no terminal effect.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The text names no fixture or particular directory and is not altered by any caller; a closed union selects the variant.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states how `directory` is printed, why the text opens with a blank line, what each kind means and what must change with the scaffold.
 * @evidence contracts/development/implementation.md#efficient-algorithms One concatenation of constant lines with one interpolation, linear in the directory's length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work `run` calls this once per successful installation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function returns a new string and holds no state, handle, or task after it returns.
 */
export function renderAutoMovieScaffoldNextSteps(
  directory: string,
  kind: "production" | "workspace" | "workspace-production",
  packageManager: IAutoMoviePackageManager = { manager: "npm" },
): string {
  if (kind === "workspace")
    return (
      `\n\nNext (from ${directory}):\n` +
      `  1. Read README.md and AGENTS.md. The workspace has no production yet.\n` +
      `  2. Run pnpm install.\n` +
      `  3. Add a production with pnpm automovie add shorts/<name> or series/<name>, then pnpm install again.\n`
    );
  if (kind === "workspace-production")
    return (
      `\n\nNext:\n` +
      `  1. Run pnpm install at the workspace root to link the production.\n` +
      `  2. Read README.md in ${directory} and the workspace AGENTS.md. This is an empty harness.\n` +
      `  3. Author the production in TypeScript under src with the public AutoMovie package APIs.\n` +
      `  4. Run pnpm run lint and pnpm run evidence there.\n`
    );
  if (packageManager.manager === "pnpm")
    return (
      `\n\nNext (from ${directory}):\n` +
      `  1. Read README.md and AGENTS.md. This is an empty harness.\n` +
      (packageManager.workspace === undefined
        ? `  2. Run pnpm install.\n`
        : `  2. Run pnpm install at the workspace root ${packageManager.workspace}; its pnpm-workspace.yaml must list this directory.\n`) +
      `  3. Author the production in TypeScript under src with the public AutoMovie package APIs.\n` +
      `  4. Run pnpm run lint for source and pnpm run evidence for checklist answers.\n`
    );
  return (
    `\n\nNext (from ${directory}):\n` +
    `  1. Read README.md and AGENTS.md. This is an empty harness.\n` +
    `  2. Run npm install --package-lock=false.\n` +
    `  3. Author the production in TypeScript under src with the public AutoMovie package APIs.\n` +
    `  4. Run npm run lint for source and npm run evidence for checklist answers.\n`
  );
}
