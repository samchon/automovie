# src/render/canonicalAutoMovieSemanticMaskPayload.ts#canonicalAutoMovieSemanticMaskPayload

## @evidence contracts/development/implementation.md#principled-implementation

Explicit fields retain every v2 semantic value except its self-declared digest; entries, node joins and unaddressed gaps are sorted by stable ids. Typed/schema-admitted inputs are required because this projection is not a value validator.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Digest computation and pretty sidecar serialization share this owner so changing a field cannot make written payload identity drift from hashed payload identity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No entry or gap is omitted for size, fixture or consumer; unknown-field refusal belongs to verifyAutoMovieSemanticMask before sidecar projection.

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies current complete payload, digest exclusion, sort order and admission responsibility; returned records/arrays are fresh while immutable scalar values are preserved.

## @evidence contracts/development/implementation.md#efficient-algorithms

E entries and G gaps require O(E log E+G log G) ordering plus each entry's node sort, with output storage proportional to all entries, nodes and gaps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Hash and sidecar consumers reuse the identical projection law; verification and serialization still recompute because a caller can mutate mask fields, so no persistent identity-only cache is claimed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh payload objects transfer to the caller and local sort arrays are temporary; no color buffer, file handle or serialization task is retained.
