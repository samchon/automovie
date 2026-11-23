# src/geometry/curve/triangulateAutoMovieParameterCell64.ts#triangulateAutoMovieParameterCell64

## @evidence contracts/development/implementation.md#principled-implementation

Monotone polygon triangulation joins two ordered horizontal chains and subdivides only declared exterior edges; every triangle uses input sample references and stays inside the same convex parameter rectangle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One parameter-only helper serves field consumers without owning coefficients, evaluation, spatial topology, normals or output indices.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No new geometric point, coordinate weld, angle gate, source lookup or consumer-specific branch changes the surface or its boundary authority.

## @evidence contracts/development/common.md#meaningful-documentation

States perimeter order, repeated-coordinate identity, exact-arithmetic translation behavior, unresolved normal scope and zero-area ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N perimeter samples, admission, the zipper and two exterior-edge searches take O(N) time and return N-2 triangles; no global Cartesian grid or recursive refinement is allocated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Coordinates are read once per sample. All chains and triangle records reference those same samples; callers retain their existing shared evaluation and vertex caches.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

O(N) parameter records and triangle references live for this call. Returned triangle references transfer to the caller; no input is mutated and no state or resource survives independently.
