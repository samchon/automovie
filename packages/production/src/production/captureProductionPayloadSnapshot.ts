import { digestAutoMovieBytes } from "./contentIdentity";
import type { IProductionPayloadSnapshot } from "./IProductionPayloadSnapshot";
import type { IProductionPayloadSnapshotEntry } from "./IProductionPayloadSnapshotEntry";

/**
 * Capture retained publication members by exact bytes before transaction transfer.
 *
 * @evidence contracts/common.md#principled-implementation Portable slash/case keys refuse duplicate addressing, and every synchronous reader result supplies a SHA-256 digest and byte count in the original declared order; absence or a thrown read aborts capture.
 * @evidence contracts/common.md#clear-and-simple-design The project owns admitted path/root semantics and this helper records the retained payload population that its locked currentness guard will compare.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existence or matching byte length alone cannot supply a snapshot, duplicate portable paths cannot shadow earlier members, and hashing consumes the returned current bytes synchronously without retaining them.
 * @evidence contracts/common.md#meaningful-documentation States duplicate identity, read failure/absence, exact digest and order; snapshot facts are transaction data rather than a publication success.
 * @evidence contracts/performance.md#efficient-algorithms For F paths and B total bytes, normalization/membership visits O(F) entries plus path characters and SHA-256 scans O(B), retaining O(F) scalar facts. The current read buffer is hashed directly without an unnecessary full copy and no payload bytes survive capture.
 * @evidence contracts/performance.md#reuse-equivalent-work One snapshot records one transaction observation; later acceptance always freshly rereads every retained member instead of reusing a past existence result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Read buffers are borrowed only until their synchronous hash completes, readers own any handles, and the returned path/digest/count list transfers to the transaction with no fixed population cap.
 */
export function captureProductionPayloadSnapshot(props: {
  paths: readonly string[];
  read: (path: string) => Uint8Array | null;
}): IProductionPayloadSnapshot {
  const seen: Set<string> = new Set<string>();
  return {
    entries: props.paths.map((path: string): IProductionPayloadSnapshotEntry => {
      const portable: string = path.replaceAll("\\", "/").toLowerCase();
      if (seen.has(portable))
        throw new Error(`Publication payload path "${path}" is duplicated.`);
      seen.add(portable);
      const value: Uint8Array | null = props.read(path);
      if (value === null)
        throw new Error(`Publication payload "${path}" is absent.`);
      return {
        path,
        digest: digestAutoMovieBytes(value),
        bytes: value.length,
      };
    }),
  };
}
