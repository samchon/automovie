import type { AutoMovieScaffoldLayer } from "./AutoMovieScaffoldLayer";
import { readAutoMovieScaffoldSources } from "./readAutoMovieScaffoldSources";
import { renderScaffoldEntries } from "./renderScaffoldEntries";
import { scaffoldAssetDirectory } from "./scaffoldAssetDirectory";
import { scaffoldSharedSkillDirectory } from "./scaffoldSharedSkillDirectory";

/**
 * Render one bundled scaffold layer into a `{ posixPath: content }` map relative to the directory it installs into.
 *
 * The layer's files are read with each `$<name>` placeholder expanded by {@link readAutoMovieScaffoldSources}, then rendered by {@link renderScaffoldEntries}: LF line endings, tokens replaced from `variables`, the layer-root `_gitignore` returned as `.gitignore`, and colliding paths refused.
 *
 * @param layer The layer to render.
 * @param variables Token values; a token absent from them fails the render.
 * @returns The rendered layer.
 * @throws When the layer or shared-skill directory is missing, on a placeholder refusal, or on a token error or path collision.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Each layer is an ordinary scaffold root, so the existing reader and renderer apply unchanged, including the root `_gitignore` rename per installed directory.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The function only joins location, reading and rendering; composition and naming stay with the public renderers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No layer or file is special-cased here; any failure throws instead of returning part of a layer.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what is read, how it is rendered, and what throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms The layer is walked and each file read and rendered once, with the costs of the reader and renderer it calls.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the layer as installed now; a render reads each layer at most once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reads close before returning, and the returned map is owned by the caller.
 */
export const renderScaffoldLayer: (
  layer: AutoMovieScaffoldLayer,
  variables: Readonly<Record<string, string>>,
) => Record<string, string> = (
  layer: AutoMovieScaffoldLayer,
  variables: Readonly<Record<string, string>>,
): Record<string, string> =>
  renderScaffoldEntries(
    readAutoMovieScaffoldSources(
      scaffoldAssetDirectory(layer),
      scaffoldSharedSkillDirectory(),
    ),
    variables,
  );
