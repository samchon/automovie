# src/validation/readAutoMovieImageFacts.ts#readAutoMovieImageFacts

## @evidence contracts/development/implementation.md#principled-implementation

Probe PNG, JPEG, WebP and Radiance dimension headers in order, returning media/edge facts or null.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Small header readers avoid full pixel decoding for texture-ledger metadata.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A recognized header does not certify checksums, complete payloads or decodability; malformed bytes outside the inspected prefix can remain undetected.

## @evidence contracts/development/common.md#meaningful-documentation

Nullable input and null refusal are explicit, and positive dimensions are admitted by validateTextureAssets.

## @evidence contracts/development/implementation.md#efficient-algorithms

JPEG marker scanning and bounded HDR text dominate; PNG/WebP fixed prefixes take constant work, without decoded-pixel allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One probe result may be cached by the production closure per asset identity, outside this pure reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a small facts record escapes; no byte buffer, decoder, file or host task is retained.
