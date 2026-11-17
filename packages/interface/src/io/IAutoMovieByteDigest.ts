/**
 * Identity of an immutable sequence of stored bytes, independent of its encoding.
 * The publisher computes SHA-256 over exactly `bytes` bytes: an archive receipt
 * identifies compressed bytes, while a JSON receipt identifies UTF-8 JSON bytes.
 * Readers verify both fields against acquired bytes before reuse. The mutable
 * receipt record neither freezes storage nor performs verification itself.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates exact stored-byte identity from encoding, storage lifetime and reader verification.
 * @evidence contracts/development/design.md#principled-representation SHA-256 and byte count bind one complete sequence; digest format and count consistency remain publisher/reader checks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Artifact writers, archive readers and file receipts share one content-identity contract independently of recovery geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The receipt does not certify geometry, processing completion or an unchanged path target.
 */

export interface IAutoMovieByteDigest {
  /** SHA-256 of the exact artifact bytes, including compression when present. */
  sha256: string;

  /** Number of artifact bytes covered by sha256. */
  bytes: number;
}
