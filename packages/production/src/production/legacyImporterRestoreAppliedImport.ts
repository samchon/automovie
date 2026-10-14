import { IAutoMovieLegacyImportPlan } from "@automovie/interface";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { legacyImporterProductionStateDirectories } from "./legacyImporterProductionStateDirectories";
import type { legacyImporterAppliedImportState } from "./legacyImporterAppliedImportState";
import type { legacyImporterLegacyImportCleanupFailure } from "./legacyImporterLegacyImportCleanupFailure";
import { legacyImporterRemoveLegacyImportTemporary } from "./legacyImporterRemoveLegacyImportTemporary";
import { legacyImporterAppliedImportFiles } from "./legacyImporterAppliedImportFiles";

/**
 * Recreate the exact admitted import-state files and the held revision token in a new staging directory, then rename into the still-missing canonical state root. Cleanup attempts preserve an earlier restoration failure.
 *
 * @evidence contracts/common.md#principled-implementation Publication's shared byte composer and directory declaration reconstruct the same plan/incarnation provenance before the resident token is added and staging is renamed.
 * @evidence contracts/common.md#clear-and-simple-design One restoration helper owns staging write/rename/cleanup, while the rollback owner admits root identity and decides whether restoration is permitted.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not rebuild from guessed current designs or adopt another revision token; caller premises require the admitted plan/state and current root authority.
 * @evidence contracts/common.md#meaningful-documentation Documents exact reconstruction, lock-token restoration, caller authority and cleanup failure visibility.
 * @evidence contracts/performance.md#efficient-algorithms Writes J encoded import bytes over the fixed state population plus T token bytes, with output-sized buffers and staged disk storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the admitted plan/incarnation and canonical import byte population, while every restoration has its own staging effects rather than sharing a prior failed attempt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns staging from mkdtemp to rename or finally removal; failure may retain staged bytes if native cleanup fails, and the rollback owner retains canonical-state/lease responsibility.
 */
export const legacyImporterRestoreAppliedImport: (stateRoot: string, root: string, plan: IAutoMovieLegacyImportPlan, state: legacyImporterAppliedImportState, lockToken: string) => void = (
  stateRoot: string,
  root: string,
  plan: IAutoMovieLegacyImportPlan,
  state: legacyImporterAppliedImportState,
  lockToken: string,
): void => {
  const staging: string = fileSystem.mkdtempSync(
    path.join(root, ".automovie-restore-"),
  );
  let failure: legacyImporterLegacyImportCleanupFailure | undefined;
  try {
    for (const directory of legacyImporterProductionStateDirectories)
      fileSystem.mkdirSync(path.join(staging, directory), { recursive: true });
    for (const [relative, bytes] of legacyImporterAppliedImportFiles(root, plan, state)) {
      const file: string = path.join(staging, ...relative.split("/"));
      fileSystem.mkdirSync(path.dirname(file), { recursive: true });
      fileSystem.writeFileSync(file, bytes);
    }
    fileSystem.writeFileSync(
      path.join(staging, "revision.lock"),
      Buffer.from(lockToken, "utf8"),
    );
    fileSystem.renameSync(staging, stateRoot);
  } catch (error) {
    failure = { error };
    throw error;
  } finally {
    if (fileSystem.existsSync(staging))
      legacyImporterRemoveLegacyImportTemporary(
        staging,
        failure,
        "rollback restoration staging directory",
      );
  }
};
