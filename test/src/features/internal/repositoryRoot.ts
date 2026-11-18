import fs from "node:fs";
import path from "node:path";

/**
 * The repository's root directory: the nearest directory at or above this
 * file's that holds the workspace's `pnpm-workspace.yaml`.
 *
 * A test reaches the repository's own files from here, so it reads the same
 * files whether it runs from its source under `test/src` (`pnpm test`) or
 * from a bundle under `test/bin/<process id>` (`pnpm test:esbuild`), whose
 * `__dirname` is the built file's directory at another depth.
 *
 * @returns The absolute root directory.
 * @throws {Error} When no directory up to the file system's root holds a `pnpm-workspace.yaml`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the marker searched for, why a depth from `__dirname` is not used, the result and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Walks the directory chain upward from `__dirname` to the first directory holding the workspace file, the marker pnpm itself resolves a workspace by.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over parent directories with one existence check each.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No depth or directory name is assumed; a missing marker throws instead of answering a guessed path.
 * @evidence contracts/development/implementation.md#efficient-algorithms One existence check per directory level, at most the depth of the path.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the file system with nothing to share across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds no handle and retains nothing.
 */
export function repositoryRoot(): string {
  let at: string = __dirname;
  for (;;) {
    if (fs.existsSync(path.join(at, "pnpm-workspace.yaml"))) return at;
    const up: string = path.dirname(at);
    if (up === at)
      throw new Error(
        `no pnpm-workspace.yaml at or above ${__dirname}: not inside the repository`,
      );
    at = up;
  }
}
