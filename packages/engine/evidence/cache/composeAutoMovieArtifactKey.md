# src/cache/composeAutoMovieArtifactKey.ts#composeAutoMovieArtifactKey

## @evidence contracts/development/implementation.md#principled-implementation

Canonical JSON over code-unit-sorted entries is a deterministic injective encoding of the record, and SHA-256 makes accidental collisions negligible; the key-format tag in the hash gives explicit invalidation when the encoding changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function owns the key text; storage, planning and resolution only compare its result, and the hash is the engine's existing portable digest.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No member is dropped or normalized beyond ordering; the caller decides what belongs in the record.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorting T toolchain and I input entries costs O((T + I) log(T + I)) comparisons and hashing is linear in the canonical text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure hash coordinates no work across requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned string outlives the call.

## @evidence contracts/development/common.md#meaningful-documentation

States the canonical text, order independence, format invalidation and the output form.
