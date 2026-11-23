# src/io/IAutoMovieByteDigest.ts#IAutoMovieByteDigest

## @evidence contracts/development/common.md#meaningful-documentation

Separates exact stored-byte identity from encoding, storage lifetime and reader verification.

## @evidence contracts/development/design.md#principled-representation

SHA-256 and byte count bind one complete sequence; digest format and count consistency remain publisher/reader checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Artifact writers, archive readers and file receipts share one content-identity contract independently of recovery geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The receipt does not certify geometry, processing completion or an unchanged path target.
