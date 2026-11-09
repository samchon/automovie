import { renderScaffoldLayer } from "./renderScaffoldLayer";

/**
 * Render the shared instruction surface: `AGENTS.md`, `CLAUDE.md` and `.agents/skills`, with every `$<name>` placeholder expanded.
 *
 * The layer is rendered with no tokens, so its bytes are identical for a single production and a workspace root, and explicit sync can compare either against one bundle. A token in an instruction file fails the render.
 *
 * @returns The instruction files, relative to the directory holding `AGENTS.md`.
 * @throws As {@link renderScaffoldLayer} does.
 *
 * @evidence contracts/development/implementation.md#principled-implementation An empty token table makes the instruction bytes independent of the project name and layout, which is what lets one sync plan serve both installations.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Creation and sync obtain the instruction surface from this one function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No installation-specific value reaches the instructions; a layout difference belongs to the production or workspace layer.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the content, why no tokens are supplied, and what fails.
 * @evidence contracts/development/implementation.md#efficient-algorithms One layer render, with the costs of the reader and renderer.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the installed bundle as it is now.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned map is owned by the caller.
 */
export const renderScaffoldInstructions: () => Record<
  string,
  string
> = (): Record<string, string> => renderScaffoldLayer("instructions", {});
