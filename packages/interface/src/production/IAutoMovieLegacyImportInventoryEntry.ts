
/**
 * One exact legacy path considered by a production import plan or rollback baseline.
 *
 * @evidence contracts/common.md#principled-implementation Canonical relative path, byte count and SHA-256 digest identify captured content; a null digest paired with zero bytes represents only an absent registered asset, distinguishing absence from an existing empty file.
 * @evidence contracts/common.md#clear-and-simple-design One entry serves legacy inventory and production-directory baselines, while the enclosing plan defines its root and canonical ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Runtime admission rejects unsafe paths, invalid digests, negative or non-integral byte counts and case-folded collisions; zero bytes alone never proves absence.
 * @evidence contracts/common.md#meaningful-documentation Defines relative POSIX paths, exact bytes, nullable asset absence and project versus registered-asset attribution.
 * @author Samchon
 */
export interface IAutoMovieLegacyImportInventoryEntry {
  /** Canonical POSIX path relative to the legacy project root, also used for rollback baseline entries. */
  path: string;

  /** Exact bytes, or zero when a registered asset is absent. */
  bytes: number;

  /** Exact content digest, or null when a registered asset is absent. */
  digest: string | null;

  /** Why this file belongs to the import boundary. */
  kind: "project" | "asset";
}
