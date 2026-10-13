import * as fs from "node:fs";
import * as path from "node:path";


/**
 * Absolute path of the bundled `scaffold` directory.
 *
 * The directory is resolved from this module's own location, one level up, so the same code finds it from `src` under `ttsx` and from the published `lib`, which the package ships next to `scaffold`.
 *
 * @returns The absolute scaffold directory.
 * @throws When nothing exists at that path, naming the path, which means the package was installed or built without its `scaffold` folder.
 *
 * @evidence contracts/common.md#principled-implementation `__dirname` is the CommonJS location of the compiled module, and both `src` and `lib` sit directly under the package root next to `scaffold`, which `package.json` lists in `files`; the premise fails only for a bundler that relocates the module, which the package does not use.
 * @evidence contracts/common.md#clear-and-simple-design One function owns where the assets are, so `renderScaffold` reads the scaffold without knowing the package layout; it takes no parameter because no caller needs another root.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The path comes only from the module location, with no environment override or test hook, and a missing directory throws instead of falling back to another location.
 * @evidence contracts/common.md#meaningful-documentation The comment states how the path is derived, why it holds for both `src` and `lib`, and what a missing directory means.
 * @evidence contracts/performance.md#efficient-algorithms One path resolution and one existence check per call, independent of the scaffold's size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result is recomputed on each call because the existence check must observe the installed package, and the CLI calls it once per process.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function returns a string and opens no handle.
 */
export const scaffoldAssetDirectory: () => string = (): string => {
  const directory: string = path.resolve(__dirname, "..", "scaffold");
  if (!fs.existsSync(directory))
    throw new Error(`scaffold assets are missing: ${directory}`);
  return directory;
};
