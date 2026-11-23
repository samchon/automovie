# src/motion/import/IAutoMovieExternalMotionSource.ts#IAutoMovieExternalMotionSource

## @evidence contracts/development/design.md#principled-representation

Manifest path, digest and length identify the declared source; adoption proves path/length agreement and digest syntax, while digest-to-resident-byte binding remains the inventory caller's responsibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adoption callers supply the declared byte identity independently of inspection; the producer checks its spelling/path/length and copies it unchanged into the receipt. Current adoption tests exercise this boundary.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ingest never hashes the bytes itself; the digest format is checked and the hash stays the manifest's claim, which the documentation does not overstate as verified.

## @evidence contracts/development/common.md#meaningful-documentation

Each property states the constraint adoption enforces on it: non-blank and equal path, the `sha256:` digest spelling, and a positive safe-integer length equal to the inspection's.
