# src/index.ts#refineRecoveryChartBoundaryChords

## @evidence contracts/development/implementation.md#principled-implementation

Interior incidence and shared fixed-side membership select only forced-collinear chords. Two incident affine triangles are each split at the same edge midpoint; their union and orientation are preserved in real arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private refinement separates PL observation incidence from subsequent harmonic mapping and coefficient generation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coordinate weld, UV clamp, reversed face, guessed source normal or source face publication repairs a failed map. All resulting UV faces still require independent admission.

## @evidence contracts/development/common.md#meaningful-documentation

States the forced-chord obstruction, private midpoint construction, coherent two-sided split and remaining map obligation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Edge and side registries and constant-size per-triangle subdivision cost O(V+F+E) work and storage for E selected chords. Each chord adds one private vertex and two triangles, and each original triangle has at most three selected edges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One incidence registry selects all original chords and physical endpoint keys determine the same midpoint identity on duplicated cut occurrences.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All registries are local; only copied private observations and a scalar subdivision count escape, and original input arrays remain immutable.
