# src/geometry/createAutoMovieEllipticLoftAtlas.ts#createAutoMovieEllipticLoftAtlas

## @evidence contracts/development/implementation.md#principled-implementation

Tensor products of the same cubic axial profiles and four standard cubic quarter arcs define every surface coefficient. Positive radius controls and increasing Y preserve an open regular section family; the explicit circular approximation bound is independent of tessellation and source fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This generic engine producer turns one pure section-family contract into the existing bicubic geometry arm, reusing its admission, adaptive tessellation and viewer consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Shared row and angular indices own exact seams rather than coordinate welding. No source samples, copied mesh, end cap, fitted fixture constant or normal field enters generation.

## @evidence contracts/development/common.md#meaningful-documentation

Gives local metre axes, cubic coefficient semantics, circular approximation derivation, orientation, continuity limits, open ends and refusal behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S spans the producer validates O(S) profiles and creates 12(3S+1) controls and 4S patches, linear in the required coefficient output; tessellation is deferred to its existing bounded owner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One angular coefficient ring and one shared row per physical span boundary supply all patches, without regenerating geometry for construction or a camera change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No state survives except the caller-owned atlas and scalar deviation bound. The input profiles are borrowed synchronously and no I/O, process, handle or global cache is acquired.
