# src/internal/index.ts#decode

## @evidence contracts/development/implementation.md#principled-implementation

Validate UTF-8 sequences before fatal decoding so failures identify original invalid bytes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation, coordinate formatting and decoding have separate helper owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid bytes throw rather than enter lossy decoding or retry paths.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states strict decoding; diagnostics give file, side, location and byte.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validation and decoding scan B bytes with O(B) output; errors also locate their prefix.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed decoder is shared, but each distinct input requires byte validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No bytes are retained after return or throw; resulting text is caller-owned.
