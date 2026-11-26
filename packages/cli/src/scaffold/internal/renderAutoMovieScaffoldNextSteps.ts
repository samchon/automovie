import type { AutoMovieTemplateScaffoldProps } from "@automovie/template";
import type { AutoMovieTemplateScaffoldProps } from "@automovie/template";

/**
 * Explain the work between a freshly written installation and a runnable
 * production.
 *
 * `directory` is printed as given (`run` passes the absolute target). The text
 * starts with a blank line because `run` appends it to the written-file list. A
 * `production` is a single production in its own pnpm repository; a `workspace`
 * is a pnpm workspace root that still needs its first production; a
 * `workspace-production` is a production added to such a root. The steps name
 * the generated `README.md`, `AGENTS.md`, the `lint` and `evidence` scripts and
 * the workspace's `add` command, so they must change with the scaffold's
 * first-run README sections.
 *
 * @param directory The installed directory.
 * @param kind Which installation was written.
 * @returns The closing text.
 */
export function renderAutoMovieScaffoldNextSteps(
  directory: string,
  kind: AutoMovieTemplateScaffoldProps["kind"],
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
  return (
    `\n\nNext (from ${directory}):\n` +
    `  1. Read README.md and AGENTS.md. This is an empty harness.\n` +
    `  2. Run pnpm install.\n` +
    `  3. Author the production in TypeScript under src with the public AutoMovie package APIs.\n` +
    `  4. Run pnpm run lint for source and pnpm run evidence for checklist answers.\n`
  );
}
