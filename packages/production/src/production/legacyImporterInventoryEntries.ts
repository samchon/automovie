import { IAutoMovieLegacyImportInventoryEntry } from "@automovie/interface";
import { compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";

/**
 * Convert captured file bytes into a sorted path/byte-length/digest inventory; null marks an absent registered asset with zero bytes and null digest. Asset membership comes from the supplied registered path list.
 *
 * @evidence contracts/common.md#principled-implementation Actual byte buffers supply size and shared SHA-256 digest; null absence remains distinct from an empty present file, and exact registered path equality supplies kind.
 * @evidence contracts/common.md#clear-and-simple-design One inventory composer serves both legacy snapshot files and pre-import owned-directory baselines.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected digest or byte count is copied from a prior plan; missing content remains explicit rather than receiving a fabricated hash.
 * @evidence contracts/common.md#meaningful-documentation Documents absence representation, path sort order and asset-kind input; digest spelling records captured content without proving future files unchanged.
 * @evidence contracts/performance.md#efficient-algorithms For F files, A registered paths and B bytes, current membership uses O(F*A) includes scans, sorting O(F log F) comparisons and hashing O(B); output retains O(F) records and hashing has its shared encoder cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses captured buffers and shared digest/comparator owners; no cross-call fingerprint cache assumes path equality means byte equality.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns size/digest records rather than retaining buffers; the caller still owns input-map byte retention, and this composer opens no descriptor.
 */
export const legacyImporterInventoryEntries: (files: ReadonlyMap<string, Uint8Array | null>, assets: readonly string[]) => IAutoMovieLegacyImportInventoryEntry[] = (
  files: ReadonlyMap<string, Uint8Array | null>,
  assets: readonly string[],
): IAutoMovieLegacyImportInventoryEntry[] =>
  [...files]
    .map(
      ([relative, bytes]: [string, Uint8Array<ArrayBufferLike> | null]): IAutoMovieLegacyImportInventoryEntry => ({
        path: relative,
        bytes: bytes?.byteLength ?? 0,
        digest: bytes === null ? null : digestAutoMovieBytes(bytes),
        kind: assets.includes(relative) ? "asset" : "project",
      }),
    )
    .sort((left: IAutoMovieLegacyImportInventoryEntry, right: IAutoMovieLegacyImportInventoryEntry): number => compareCodeUnits(left.path, right.path));
