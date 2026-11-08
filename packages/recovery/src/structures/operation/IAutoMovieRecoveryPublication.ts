/**
 * Receipt for one immutable artifact, identifying its path and exact emitted bytes.
 *
 * @evidence contracts/development/design.md#principled-representation The path, SHA-256 and byte count identify one immutable serialized artifact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A publication receipt describes exact stored bytes independently of the artifact's geometry or processing status.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Byte identity does not certify geometric equality, coverage or visual quality.
 * @evidence contracts/development/common.md#meaningful-documentation States destination-path identity, exact-byte hashing and the UTF-8 byte-count unit.
 */
export interface IAutoMovieRecoveryPublication {
  /** Destination path supplied for the immutable published artifact. */
  path: string;

  /** SHA-256 of the exact published or acquired bytes. */
  sha256: string;

  /** Number of emitted UTF-8 bytes. */
  bytes: number;
}
