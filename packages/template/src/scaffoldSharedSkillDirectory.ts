import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Absolute path of the repository skills the scaffold ships in place of its `$<name>.md` placeholders.
 *
 * The build's instruction step copies each repository skill a placeholder names, verbatim, into `lib/skills/<name>`, and the path is resolved from this module's own location one level up, so the same code finds it from `src` under `ttsx` and from the published `lib`. The copy lives under `lib` because `lib` is already ignored by git and already listed in the package's `files`, so neither the scaffold nor the repository holds a second tracked or ignored copy.
 *
 * @returns The absolute shared-skill directory.
 * @throws When nothing exists at that path, naming the path, which means the package was installed or built without running its `build:instructions` step.
 *
 * @evidence contracts/development/implementation.md#principled-implementation `__dirname` is the CommonJS location of the compiled module, and both `src` and `lib` sit directly under the package root, so `../lib/skills` names one directory from either; the premise fails only for a bundler that relocates the module, which the package does not use.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns where the shared skills are, beside `scaffoldAssetDirectory`, so the source reader expands placeholders without knowing the package layout; it takes no parameter because no caller needs another root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The path comes only from the module location, with no environment override, test hook or fallback to the repository's own `.agents/skills`, and a missing directory throws.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what the directory holds, which build step fills it, how the path is derived for `src` and `lib`, why it lives under `lib`, and what a missing directory means.
 * @evidence contracts/development/implementation.md#efficient-algorithms One path resolution and one existence check per call, independent of the skills' size.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The result is recomputed on each call because the existence check must observe the installed package, and a render calls it once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function returns a string and opens no handle.
 */
export const scaffoldSharedSkillDirectory: () => string = (): string => {
  const directory: string = path.resolve(__dirname, "..", "lib", "skills");
  if (!fs.existsSync(directory))
    throw new Error(`scaffold shared skills are missing: ${directory}`);
  return directory;
};
