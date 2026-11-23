# src/material/autoMovieProceduralHash.ts#autoMovieProceduralHash

## @evidence contracts/development/common.md#meaningful-documentation

States the key construction, why the salt exists, the origin of the filler constant and the GPU counterpart.

## @evidence contracts/development/implementation.md#principled-implementation

Hashing the seed and salt into a key and xoring it into the cell before a second PCG3D round decorrelates seeds and uses, since PCG3D mixes every input bit into every output word.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function states the lattice words every procedural feature reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The filler is the conventional golden-ratio word, not a tuned value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two hash calls; callers that read many cells of one key (the noise) hash the key once themselves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
