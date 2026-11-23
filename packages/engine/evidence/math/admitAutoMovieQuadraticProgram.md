# src/math/admitAutoMovieQuadraticProgram.ts#admitAutoMovieQuadraticProgram

## @evidence contracts/development/implementation.md#principled-implementation

Indexed vector/row admission establishes dense finite coefficients below the numerical sentinel, PSD diagonal terms, complete rows, unique in-range variable indices and ordered nullable intervals. One signed-int32 last-row marker per variable detects duplicates without sorting or changing zero coefficients.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This admission owner is shared by CSC assembly, bounded displacement, original-coordinate refinement and the underwear-surface restricted solve. It checks the original full population while those consumers own selection, solving and acceptance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No row is skipped, normalized, merged or repaired; resident vector/index/row holes fail actual indexed reads. Typed array/row shape and allocatable marker storage remain premises; aggregate CSC, sparse fill and workspace capacity are unchecked here, and admission does not imply numerical solve or geometric success.

## @evidence contracts/development/common.md#meaningful-documentation

States int32 dimensions, vector/row completeness, nonnegative diagonal, index uniqueness, null-bound meaning, strict 1e30 limits, unchanged input and explicit-rule versus host allocation failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

N variables, M rows and Z listed entries require O(N+M+Z) work, including marker initialization and dense vector scans. The Int32Array adds four N bytes plus its host object, avoids per-row sets and is allocated even when the row population is empty.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same marker buffer serves every row by storing its latest row ordinal; vectors and scalar bounds share private admission predicates. Changed mutable programs are reread and no verdict or buffer is cached between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inputs remain borrowed and unmodified; the call-local marker becomes unreachable on return or throw and is reclaimed by the host rather than explicitly disposed. Explicit refusal creates one Error/host stack without attaching the input, and no matrix, numerical kernel workspace or task is acquired.
