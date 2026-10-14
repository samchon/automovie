import type { Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionRootNamespaceCoordinationRoot } from "./productionRootNamespaceCoordinationRoot";
import { AUTOMOVIE_COORDINATION_ROOT_VARIABLE } from "./AUTOMOVIE_COORDINATION_ROOT_VARIABLE";

/**
 * Request coordination-directory creation with mode 0700, then require a physical directory and writable access. Native host mode semantics apply, and an existing directory's permissions remain its owner's responsibility.
 *
 * @evidence contracts/common.md#principled-implementation mkdir with a creation-only 0700 request or EEXIST admission precedes physical-directory and writable-access checks. Host permission semantics determine the effective mode, and existing permissions are not reset.
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
  // Attribute an unwritable coordination directory before attempting a token
  // file, so its refusal can name the shared root configuration the host controls.
  try {
    fileSystem.accessSync(productionRootNamespaceCoordinationRoot(), fileSystem.constants.W_OK);
  } catch (error) {
    throw new Error(
      `AutoMovie cannot write the root-lock coordination directory "${productionRootNamespaceCoordinationRoot()}", so it cannot fence this project against another process. This is the account's home by default, which a sandbox that admits only its workdir and the temporary directories does not grant. Set ${AUTOMOVIE_COORDINATION_ROOT_VARIABLE} to an absolute directory every process working on this project can write, and set it identically for all of them: two processes fencing against two directories exclude nothing.`,
      { cause: error },
    );
  }
};
