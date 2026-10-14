import type { Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { legacyImporterLstatOrNull } from "./legacyImporterLstatOrNull";

/**
 * Admit one existing physical dedicated project directory, excluding symlinks, nondirectories and the filesystem root, then return its canonical real path.
 *
 * @evidence contracts/common.md#principled-implementation Resolve/lstat admission establishes a dedicated physical directory before realpath supplies canonical spelling for later namespace fencing.
 * @evidence contracts/common.md#clear-and-simple-design One entry validation is shared by public import operations and snapshot capture, while current leased identity is checked separately by the namespace owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing root is created and no requested root symlink is followed as a compatibility shortcut; finite path validation does not replace later lease checks.
 * @evidence contracts/common.md#meaningful-documentation States dedicated-directory and filesystem-root refusals and the returned canonical spelling.
 * @evidence contracts/performance.md#efficient-algorithms Path resolution and two filesystem observations cost path length plus native latency, with one returned string and fixed stat bookkeeping.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the admission procedure but repeats observations because root identity may change between operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a path value without a descriptor or acquired lease; subsequent operation owners acquire and release their own namespace locks.
 */
export const legacyImporterValidateLegacyRoot: (rootDirectory: string) => string = (rootDirectory: string): string => {
  const root: string = path.resolve(rootDirectory);
  const status: Stats | null = legacyImporterLstatOrNull(root);
  if (
    status === null ||
    status.isSymbolicLink() ||
    status.isDirectory() === false ||
    path.parse(root).root === root
  )
    throw new Error(
      `Legacy project root "${root}" must be one physical, dedicated project directory.`,
    );
  return fileSystem.realpathSync(root);
};
