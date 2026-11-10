import type { IAutoMovieScaffoldProps } from "./IAutoMovieScaffoldProps";
import { assertScaffoldProjectName } from "./assertScaffoldProjectName";
import { createScaffoldVariables } from "./createScaffoldVariables";
import { renderScaffoldLayer } from "./renderScaffoldLayer";

/**
 * Render one production for a workspace from {@link renderWorkspaceScaffold}, into an in-memory `{ posixPath: content }` map relative to its directory `movies/<shorts|series>/<directory>`.
 *
 * Only the `production` layer is rendered: the instructions and their sync state stay at the workspace root. `{{name}}` is the admitted package name, `{{skills}}` is `../../../.agents/skills`, the workspace root's shared tree three directories up, and every `{{version:<key>}}` is `catalog:<name>` of its `AUTOMOVIE_TEMPLATE_CATALOGS` group, resolved by the root's `pnpm-workspace.yaml`. Nothing is written.
 *
 * @param props The production's package name, admitted by {@link assertScaffoldProjectName}.
 * @returns The rendered file map.
 * @throws When the name is refused, when the layer or the shared-skill directory is missing, or on a token error or path collision.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The fixed depth of `movies/<family>/<directory>` makes the shared skills exactly three directories up, and pnpm resolves `catalog:` through the workspace root's catalog.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The same production layer serves a single production and a workspace production; only the skills path and dependency mode differ.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The workspace root is never searched for or inspected; the caller chooses the target, and the layout is documented instead of detected.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the target directory, what is excluded, every token value, and what throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One layer render with the reader's and renderer's costs.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the scaffold as installed now and is made once per CLI run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reads close before returning, and the returned map is owned by the caller.
 */
export const renderWorkspaceProductionScaffold: (
  props: IAutoMovieScaffoldProps,
) => Record<string, string> = (
  props: IAutoMovieScaffoldProps,
): Record<string, string> =>
  renderScaffoldLayer(
    "production",
    createScaffoldVariables({
      name: assertScaffoldProjectName(props.name),
      skills: "../../../.agents/skills",
      dependencies: "catalog",
    }),
  );
