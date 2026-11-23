# src/narrative/internal/metadataRewrite/normalizeFile.ts#normalizeFile

## @evidence contracts/development/implementation.md#principled-implementation

Slash-normalize and require exact POSIX normalization, a relative Markdown suffix and no drive or dot segments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validator serves both selected paths and sample identities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Escaping or noncanonical paths throw instead of being repaired into another file.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states root-escape protection; errors require normalized relative Markdown paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Replacement, normalization and segment checks scale with path length and proportional temporary allocations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Node normalization is reused as the primitive; independent paths are not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local strings and arrays expire after return or throw; the path is caller-owned.
