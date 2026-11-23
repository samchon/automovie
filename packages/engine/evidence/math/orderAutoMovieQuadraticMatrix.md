# src/math/orderAutoMovieQuadraticMatrix.ts#orderAutoMovieQuadraticMatrix

## @evidence contracts/development/implementation.md#principled-implementation

Exact minimum-degree graph elimination selects a symmetric permutation that preserves the KKT system, using structural entries even when their numeric coefficient is zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner handles ordering only; numerical factorization independently derives its elimination tree and reuses the permutation for the whole solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Tie breaking uses input ordinal and no numerical value, fixture or consumer controls the order; no authored coefficient is removed.

## @evidence contracts/development/common.md#meaningful-documentation

States tie breaking, induced fill, sparse storage and the limitation that dense fill can remain unavoidable.

## @evidence contracts/development/implementation.md#efficient-algorithms

N=n+m vertices and Z edges use adjacency sets plus one N-entry indexed heap. Work is O(sum of elimination-degree squared plus neighbor heap updates times log N), and peak graph memory follows actual filled edges rather than N squared by default.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One order serves every barrier update within the immutable conic structure; heap positions prevent unbounded stale heap entries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Eliminated adjacency sets are cleared immediately; heap, graph and positions are call-local and only the N-entry permutation escapes.
