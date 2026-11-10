import * as fs from "node:fs";
import * as path from "node:path";

import type { AutoMovieScaffoldLayer } from "./AutoMovieScaffoldLayer";

/**
 * Absolute path of one bundled scaffold layer, `scaffold/<layer>`.
 *
 * The directory is resolved from this module's own location, one level up, so the same code finds it from `src` under `ttsx` and from the published `lib`, which the package ships next to `scaffold`.
 *
 * @param layer The layer to locate.
 * @returns The absolute layer directory.
 * @throws When nothing exists at that path, naming the path, which means the package was installed or built without that part of its `scaffold` folder.
 *
 * @evidence contracts/development/implementation.md#principled-implementation `__dirname` is the CommonJS location of the compiled module, and both `src` and `lib` sit directly under the package root next to `scaffold`, which `package.json` lists in `files`; the premise fails only for a bundler that relocates the module, which the package does not use.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns where the assets are, so the renderers read a layer without knowing the package layout; the closed layer union is its only input.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The path comes only from the module location and the layer name, with no environment override or test hook, and a missing directory throws instead of falling back to another location.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states how the path is derived, why it holds for both `src` and `lib`, and what a missing directory means.
 * @evidence contracts/development/implementation.md#efficient-algorithms One path resolution and one existence check per call, independent of the scaffold's size.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The result is recomputed on each call because the existence check must observe the installed package, and each render calls it once per layer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function returns a string and opens no handle.
 */
export const scaffoldAssetDirectory: (
  layer: AutoMovieScaffoldLayer,
) => string = (layer: AutoMovieScaffoldLayer): string => {
  const directory: string = path.resolve(__dirname, "..", "scaffold", layer);
  if (!fs.existsSync(directory))
    throw new Error(`scaffold assets are missing: ${directory}`);
  return directory;
};
