import type { IAutoMovieScaffoldProps } from "./IAutoMovieScaffoldProps";
import { assertScaffoldProjectName } from "./assertScaffoldProjectName";
import { attachScaffoldSyncState } from "./attachScaffoldSyncState";
import { createScaffoldVariables } from "./createScaffoldVariables";
import { mergeScaffoldFiles } from "./mergeScaffoldFiles";
import { renderScaffoldInstructions } from "./renderScaffoldInstructions";
import { renderScaffoldLayer } from "./renderScaffoldLayer";

/**
 * Render a single production, its own repository, into an in-memory `{ posixPath: content }` map.
 *
 * The map joins the shared instruction surface from {@link renderScaffoldInstructions} with the `production` layer, whose `{{name}}` is the admitted name, `{{skills}}` the production's own `.agents/skills`, and `{{version:<key>}}` the build-time `AUTOMOVIE_TEMPLATE_VERSIONS` ranges. Every file has LF line endings, the root `_gitignore` stand-in is returned as `.gitignore`, and the generated instruction digests are added for explicit later sync. Nothing is written; {@link publishFiles} and {@link writeFiles} write the map.
 *
 * @param props The project's name, admitted by {@link assertScaffoldProjectName}.
 * @returns The rendered file map.
 * @throws When the name is refused, when a layer or the shared-skill directory is missing, on a placeholder refusal, on a token error, or on a path collision within or between layers.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The production's links and evidence configuration reach `.agents/skills` beside them, and its dependencies carry the ranges this package was built with.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The function chooses the layers and token values; name admission, layer rendering, joining and sync state each have one owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The only variables are the name, the skills path and the generated version table, with no per-file exception; a failure in any step throws instead of returning a partial map.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the layers, every token value, the normalization and rename, the added state, that nothing is written, and what throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two layer renders, one join pass and one digest per instruction file.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the scaffold as installed now and is made once per CLI run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reads close before returning, and the returned map, which holds the whole rendered scaffold in memory, is owned by the caller.
 */
export const renderScaffold: (
  props: IAutoMovieScaffoldProps,
) => Record<string, string> = (
  props: IAutoMovieScaffoldProps,
): Record<string, string> =>
  attachScaffoldSyncState(
    mergeScaffoldFiles(
      renderScaffoldInstructions(),
      renderScaffoldLayer(
        "production",
        createScaffoldVariables({
          name: assertScaffoldProjectName(props.name),
          skills: ".agents/skills",
          dependencies: "release",
        }),
      ),
    ),
  );
