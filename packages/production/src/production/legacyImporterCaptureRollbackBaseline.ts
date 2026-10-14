import type { Stats } from "node:fs";
import { IAutoMovieLegacyOwnedDirectoryBaseline } from "@automovie/interface";
import path from "node:path";
import { compareCodeUnits } from "./contentIdentity";
import { legacyImporterInventoryEntries } from "./legacyImporterInventoryEntries";
import { legacyImporterCollectDirectory } from "./legacyImporterCollectDirectory";
import { legacyImporterLstatOrNull } from "./legacyImporterLstatOrNull";

/**
 * Record whether src, generated and renders existed before import, plus their sorted directory and byte-digest inventories. Absent roots remain explicit empty baselines; linked or nondirectory roots refuse.
 *
 * @evidence contracts/common.md#principled-implementation A fixed production-owned path population captures exact pre-import existence and content, so later rollback can distinguish legacy work from newly created empty directories.
 * @evidence contracts/common.md#clear-and-simple-design Uses the shared directory collector and inventory composer to keep baseline capture aligned with later comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected box, authored prose or missing file is substituted for actual bytes; an existing malformed baseline root refuses.
 * @evidence contracts/common.md#meaningful-documentation States the fixed three roots, absence meaning, sorted content witnesses and that digest inventory records bytes rather than holding a native snapshot transaction.
 * @evidence contracts/performance.md#efficient-algorithms For baseline F files/B bytes, full capture and hashing are required, with directory sorting, O(B) peak captured buffers and O(F) retained inventory records.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares traversal, digest composition and comparator with import inventory; baseline bytes are reread for a new capture because current filesystem state is authoritative.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned baselines retain paths/digests instead of file byte buffers; temporary capture buffers expire after composition and descriptor lifetime stays with the owned-file reader.
 */
export const legacyImporterCaptureRollbackBaseline: (root: string) => IAutoMovieLegacyOwnedDirectoryBaseline[] = (
  root: string,
): IAutoMovieLegacyOwnedDirectoryBaseline[] =>
  (["src", "generated", "renders"] as const).map((relative: "src" | "generated" | "renders"): IAutoMovieLegacyOwnedDirectoryBaseline => {
    const absolute: string = path.join(root, relative);
    const status: Stats | null = legacyImporterLstatOrNull(absolute);
    if (status === null)
      return {
        path: relative,
        existed: false,
        directories: [],
        files: [],
      };
    if (status.isSymbolicLink() || status.isDirectory() === false)
      throw new Error(
        `Production-owned rollback baseline "${absolute}" must be a physical directory.`,
      );
    const files: Map<string, Uint8Array<ArrayBufferLike> | null> = new Map<string, Uint8Array | null>();
    const directories: string[] = [];
    legacyImporterCollectDirectory(root, relative, files, directories);
    directories.sort(compareCodeUnits);
    return {
      path: relative,
      existed: true,
      directories,
      files: legacyImporterInventoryEntries(files, []),
    };
  });
