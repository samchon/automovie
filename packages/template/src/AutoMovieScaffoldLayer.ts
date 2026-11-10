/**
 * One bundled scaffold layer, a directory under the package's `scaffold` folder that the renderers compose.
 *
 * - `instructions`: `AGENTS.md`, `CLAUDE.md` and `.agents/skills`, the shared instruction surface that explicit sync owns.
 * - `production`: one production's package, configuration, `PROJECT.md`, README, source and tests.
 * - `workspace`: a pnpm workspace root's `pnpm-workspace.yaml`, `package.json`, README and ignore rules.
 *
 * A single production is `instructions` plus `production`; a workspace root is `instructions` plus `workspace`, and each production added to it is `production` alone.
 *
 * @evidence contracts/development/design.md#principled-representation The three members partition the shipped scaffold by owner: shared instructions, one production, and the workspace root, so each installation is a union of whole layers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed union names the folders the renderers may read, so no caller can request a path outside the bundle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No layer carries a per-installation exception; a layout difference is a token value or another layer.
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists every layer's content and which installations compose which layers.
 */
export type AutoMovieScaffoldLayer =
  | "instructions"
  | "production"
  | "workspace";
