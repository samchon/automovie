import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { legacyImporterLegacyImportCleanupFailure } from "./legacyImporterLegacyImportCleanupFailure";
import { legacyImporterLegacyImportCleanupError } from "./legacyImporterLegacyImportCleanupError";

/**
 * Remove one operation-owned temporary import directory. A lone native cleanup failure propagates unchanged; after an earlier operation failure, preserve both causes in an import cleanup aggregate.
 *
 * @evidence contracts/common.md#principled-implementation The caller supplies actual owned temporary path and an optional primary-failure record, so cleanup composition preserves even a non-Error thrown value.
 * @evidence contracts/common.md#clear-and-simple-design One cleanup boundary is shared by planning clones, publication staging and restoration staging.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No retry, swallowed cleanup result or foreign filesystem replacement declares removal completed after native failure; caller ownership must already establish the path is appropriate to remove.
 * @evidence contracts/common.md#meaningful-documentation States force/recursive removal, primary-plus-cleanup ordering and caller path-ownership premise.
 * @evidence contracts/performance.md#efficient-algorithms Recursive removal cost follows the temporary directory's filesystem entries/bytes and host behavior; error composition retains two cause references and resource-description text.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares error-preserving cleanup policy across temporary scopes, but effectful directory removal is attempted for each owning path rather than cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful rm ends the owned temporary directory; failure leaves its physical population unresolved and throws without clearing a proof of retained bytes.
 */
export const legacyImporterRemoveLegacyImportTemporary: (temporary: string, failure: legacyImporterLegacyImportCleanupFailure | undefined, resource: string) => void = (
  temporary: string,
  failure: legacyImporterLegacyImportCleanupFailure | undefined,
  resource: string,
): void => {
  try {
    fileSystem.rmSync(temporary, { force: true, recursive: true });
  } catch (cleanupFailure) {
    if (failure === undefined) throw cleanupFailure;
    throw new legacyImporterLegacyImportCleanupError(
      [failure.error, cleanupFailure],
      `Legacy import cleanup failed after the operation failed: ${resource}.`,
    );
  }
};
