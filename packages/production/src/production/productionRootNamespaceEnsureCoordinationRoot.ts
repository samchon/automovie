import type { Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionRootNamespaceCoordinationRoot } from "./productionRootNamespaceCoordinationRoot";
import { AUTOMOVIE_COORDINATION_ROOT_VARIABLE } from "./AUTOMOVIE_COORDINATION_ROOT_VARIABLE";

/**
 * Create the coordination directory with mode 0700 when absent, then require a physical directory and writable access. An existing directory's permissions remain its owner's responsibility.
 *
 * @evidence contracts/common.md#principled-implementation Exclusive mkdir or EEXIST admission precedes physical-directory and access checks, preserving the shared directory's existing permissions instead of resetting another owner's mode.
 * @evidence contracts/common.md#clear-and-simple-design Centralizes directory preparation for every coordinate path; path selection stays in the memoized resolver and token fencing stays in commit-lock acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A symlink, nondirectory or unwritable directory refuses explicitly; no chmod or alternate directory bypass changes the coordination authority.
 * @evidence contracts/common.md#meaningful-documentation Documents creation-only mode, physical/writable requirements and that all cooperating processes must share the selected root.
 * @evidence contracts/performance.md#efficient-algorithms Uses a fixed number of mkdir/stat/access operations per coordinate-path request, with constant bookkeeping and host filesystem latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the resolved directory path but repeats physical and writable checks because a memoized name does not establish current filesystem suitability.
 * @evidence contracts/performance.md#bound-retention-and-release-resources May leave a created directory on later validation failure; it retains no handle, and the directory persists as shared coordination infrastructure rather than a per-operation temporary.
 */
export const productionRootNamespaceEnsureCoordinationRoot: () => void = (): void => {
  try {
    fileSystem.mkdirSync(productionRootNamespaceCoordinationRoot(), { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const linked: Stats = fileSystem.lstatSync(productionRootNamespaceCoordinationRoot());
  if (linked.isSymbolicLink() || linked.isDirectory() === false)
    throw new Error(
      `AutoMovie root-lock coordination path "${productionRootNamespaceCoordinationRoot()}" is not a physical directory.`,
    );
  // Asked here rather than discovered at the lock file's own `open()`. The
  // later refusal names the file and says waiting will not clear it, which is
  // true and leaves the reader holding an errno about a path they never chose.
  // A sandbox whose writable roots are the workdir and the temporary
  // directories fails this every time, and the only useful thing to say is
  // where to move the root to.
  try {
    fileSystem.accessSync(productionRootNamespaceCoordinationRoot(), fileSystem.constants.W_OK);
  } catch (error) {
    throw new Error(
      `AutoMovie cannot write the root-lock coordination directory "${productionRootNamespaceCoordinationRoot()}", so it cannot fence this project against another process. This is the account's home by default, which a sandbox that admits only its workdir and the temporary directories does not grant. Set ${AUTOMOVIE_COORDINATION_ROOT_VARIABLE} to an absolute directory every process working on this project can write, and set it identically for all of them: two processes fencing against two directories exclude nothing.`,
      { cause: error },
    );
  }
};
