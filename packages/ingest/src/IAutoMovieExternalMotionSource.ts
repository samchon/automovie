/**
 * Manifest-owned identity of the exact external motion bytes the author chose.
 *
 * Adoption compares path and byte length with the inspection and checks digest spelling. The digest remains the manifest owner's claim: equal path and length alone do not prove equal byte content, so that owner must bind the digest to the resident bytes before inspection.
 *
 * @evidence contracts/common.md#principled-implementation Manifest path, digest and length identify the declared source; adoption proves path/length agreement and digest syntax, while digest-to-resident-byte binding remains the inventory caller's responsibility.
 * @evidence contracts/common.md#clear-and-simple-design The identity is its own record because the production inventory builds it from the manifest independently of the inspection, and the adoption copies it unchanged into the receipt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ingest never hashes the bytes itself; the digest format is checked and the hash stays the manifest's claim, which the documentation does not overstate as verified.
 * @evidence contracts/common.md#meaningful-documentation Each property states the constraint adoption enforces on it: non-blank and equal path, the `sha256:` digest spelling, and a positive safe-integer length equal to the inspection's.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares data only; the comparisons that read it run in `adoptAutoMovieExternalMotion`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No computation is attached to the source record, so nothing could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three scalar fields hold no buffer, handle or task, and the receipt keeps a shallow copy.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionSource {
  /** Manifest path; it must be non-blank and equal the inspected path. */
  path: string;

  /** `sha256:` plus 64 lowercase hex digits, pinned by the production manifest. */
  digest: string;

  /** Resident byte count; a positive safe integer equal to the inspected one. */
  byteLength: number;
}
