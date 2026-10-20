/**
 * Receipt for one immutable artifact, identifying its path and exact emitted bytes.
 *
 * @evidence contracts/common.md#principled-implementation The path, SHA-256 and byte count identify one immutable serialized artifact.
 * @evidence contracts/common.md#clear-and-simple-design A publication receipt describes exact stored bytes independently of the artifact's geometry or processing status.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Byte identity does not certify geometric equality, coverage or visual quality.
 * @evidence contracts/common.md#meaningful-documentation States destination-path identity, exact-byte hashing and the UTF-8 byte-count unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoveryPublication {
  /** Destination path supplied for the immutable published artifact. */
  path: string;

  /** SHA-256 of the exact published or acquired bytes. */
  sha256: string;

  /** Number of emitted UTF-8 bytes. */
  bytes: number;
}
