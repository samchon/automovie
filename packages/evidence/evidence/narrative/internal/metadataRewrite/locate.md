# src/internal/index.ts#locate

## @evidence contracts/development/implementation.md#principled-implementation

Decode a byte prefix, split CRLF, CR or LF and count final-line Unicode code points.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Byte coordinates enter; one-based text coordinates leave for diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Columns count code points rather than treating UTF-16 units as bytes.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states byte-to-one-based-line and Unicode-column mapping.

## @evidence contracts/development/implementation.md#efficient-algorithms

A P-byte prefix needs O(P) decoding, splitting and transient space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each diagnostic offset determines its prefix; no full-file index is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Prefix strings, line arrays and code-point arrays are call-local; only numbers are returned.
