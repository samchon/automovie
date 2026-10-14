import { IAutoMovieLegacyOwnedDirectoryBaseline } from "@automovie/interface";

/**
 * One optimistic legacy capture: physical root, matching resident revision, registered asset order, captured file bytes and pre-import owned-directory baselines. Null file bytes record absent registered content, distinct from an empty present file.
 *
 * @evidence contracts/common.md#principled-implementation Pairs revision/root authority with actual captured bytes and baselines so plan composition and rollback comparison read one witnessed source population.
 * @evidence contracts/common.md#clear-and-simple-design One record crosses capture into temporary validation and draft composition; persisted inventory later keeps digests rather than duplicating these byte buffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A snapshot record is not an atomic native filesystem image, and its type does not validate arbitrary caller-created records or deep-freeze map entries.
 * @evidence contracts/common.md#meaningful-documentation Documents revision coherence, asset order, byte/null meanings and baseline preservation duties.
 * @evidence contracts/performance.md#efficient-algorithms The type executes no scan; the capture owner accounts for F paths/B bytes and baseline traversal, and retained memory follows captured byte and path populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured map bytes are shared by one temporary clone and inventory calculation; new captures renew revision and file authority rather than reusing by path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The snapshot owner retains byte buffers and baseline/path arrays until planning/comparison ends, with no numeric population cap; no native descriptor transfers through the record.
 * @author Samchon
 */
export interface legacyImporterLegacySnapshot {
  /** Canonical physical legacy project root whose namespace is fenced by the caller. */
  root: string;

  /** Nonnegative resident revision witnessed before and after inventory capture. */
  revision: number;

  /** Manifest asset paths in their recorded order, admitted as canonical relative paths. */
  assets: string[];

  /** Captured bytes keyed by canonical path; null records an absent registered asset. */
  files: ReadonlyMap<string, Uint8Array | null>;

  /** Original contents of src, generated and renders, used to refuse destructive rollback. */
  rollbackBaseline: IAutoMovieLegacyOwnedDirectoryBaseline[];
}
