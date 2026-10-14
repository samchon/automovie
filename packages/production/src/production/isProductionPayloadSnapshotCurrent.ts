import { digestAutoMovieBytes } from "./contentIdentity";
import type { IProductionPayloadSnapshot } from "./IProductionPayloadSnapshot";
import type { IProductionPayloadSnapshotEntry } from "./IProductionPayloadSnapshotEntry";

/**
 * Require fresh exact bytes for every retained publication snapshot member.
 *
 * @evidence contracts/common.md#principled-implementation Every member must remain readable with the captured length and SHA-256; the first absence, replacement, length mismatch or reader failure returns false and an empty population is vacuously current.
 * @evidence contracts/common.md#clear-and-simple-design The render publication authority invokes this guard for retained bytes inside its own transaction checks; project readers own physical identity and path safety.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A same-size replacement cannot pass by pathname or length alone, and thrown reads are refused rather than replaced with stale observations. This before/after comparison cannot detect change-and-return between its reads.
 * @evidence contracts/common.md#meaningful-documentation States fresh byte/length comparison, empty behavior, short-circuit refusal and change-and-return limitation.
 * @evidence contracts/performance.md#efficient-algorithms For F entries and B matching-length readable bytes, one short-circuit ordered scan costs O(F+B) plus reader work; changed lengths avoid hashing and no resident byte population is retained.
 * @evidence contracts/performance.md#reuse-equivalent-work Snapshot facts are shared inside the transaction, but every guard invocation rereads current bytes and caches no successful observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each current buffer is local to its read/hash and the reader owns handle cleanup; the guard returns one boolean and starts no task.
 */
export function isProductionPayloadSnapshotCurrent(props: {
  snapshot: IProductionPayloadSnapshot;
  read: (path: string) => Uint8Array | null;
}): boolean {
  return props.snapshot.entries.every((entry: IProductionPayloadSnapshotEntry): boolean => {
    try {
      const value: Uint8Array | null = props.read(entry.path);
      return (
        value !== null &&
        value.length === entry.bytes &&
        digestAutoMovieBytes(value) === entry.digest
      );
    } catch {
      return false;
    }
  });
}
