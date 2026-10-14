import type { Stats } from "node:fs";
import { IAutoMovieLegacyOwnedDirectoryBaseline } from "@automovie/interface";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { compareCodeUnits } from "./contentIdentity";
import { legacyImporterInventoryEntries } from "./legacyImporterInventoryEntries";
import { legacyImporterCollectDirectory } from "./legacyImporterCollectDirectory";
import { legacyImporterEqualStrings } from "./legacyImporterEqualStrings";
import { legacyImporterSameInventory } from "./legacyImporterSameInventory";
import { legacyImporterLstatOrNull } from "./legacyImporterLstatOrNull";

/**
 * Refuse removal when previously absent owned directories now contain work, or previously present roots no longer reproduce their complete recorded directory/file digest inventories. Existing legacy bytes are preserved.
 *
 * @evidence contracts/common.md#principled-implementation Absent-baseline roots may remain absent or become empty physical directories, while existing roots require full current tree and captured-byte inventory equality before rollback.
 * @evidence contracts/common.md#clear-and-simple-design Owns the pre-import work-preservation boundary, sharing traversal and inventory composition with baseline capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts New files, links, replaced root kinds and changed byte inventories refuse instead of deleting later work; baseline hashes are compared to current reads rather than treated as live evidence.
 * @evidence contracts/common.md#meaningful-documentation States distinct absent/present rules and path-specific changed-work refusal before destructive rollback.
 * @evidence contracts/performance.md#efficient-algorithms Reads and hashes B baseline bytes across F entries, sorts current inventories and compares them linearly, retaining population-sized temporary buffers/records without a byte cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the recorded baseline and common inventory representation, but current content is fully recaptured because historical equivalence is not rollback authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no additional lease; the outer rollback owns root/resident locks, readers own descriptor closure and capture buffers expire after comparison.
 */
export const legacyImporterAssertRollbackBaseline: (root: string, baselines: readonly IAutoMovieLegacyOwnedDirectoryBaseline[]) => void = (
  root: string,
  baselines: readonly IAutoMovieLegacyOwnedDirectoryBaseline[],
): void => {
  for (const baseline of baselines) {
    const directory: string = path.join(root, baseline.path);
    const status: Stats | null = legacyImporterLstatOrNull(directory);
    if (baseline.existed === false) {
      if (
        status !== null &&
        (status.isSymbolicLink() ||
          status.isDirectory() === false ||
          fileSystem.readdirSync(directory).length !== 0)
      )
        throw new Error(
          `Production-owned directory "${directory}" contains work created after import. Preserve it; rollback refused.`,
        );
      continue;
    }
    if (
      status === null ||
      status.isSymbolicLink() ||
      status.isDirectory() === false
    )
      throw new Error(
        `Production-owned directory "${directory}" changed after import. Restore its pre-import contents before rollback.`,
      );
    const files: Map<string, Uint8Array<ArrayBufferLike> | null> = new Map<string, Uint8Array | null>();
    const directories: string[] = [];
    legacyImporterCollectDirectory(root, baseline.path, files, directories);
    directories.sort(compareCodeUnits);
    if (
      legacyImporterEqualStrings(baseline.directories, directories) === false ||
      legacyImporterSameInventory(baseline.files, legacyImporterInventoryEntries(files, [])) === false
    )
      throw new Error(
        `Production-owned directory "${directory}" changed after import. Preserve current work; rollback refused.`,
      );
  }
};
