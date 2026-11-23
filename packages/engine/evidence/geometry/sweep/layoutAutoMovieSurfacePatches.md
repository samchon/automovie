# src/geometry/sweep/layoutAutoMovieSurfacePatches.ts#layoutAutoMovieSurfacePatches

## @evidence contracts/development/implementation.md#principled-implementation

A structured multi-block layout: per-patch grids, face-varying UVs and the shared `(patch, s, t)` chart.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Topology and texture layout in one module, separate from evaluation, because they depend only on the declared counts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Overlapping or misoriented patches are refused, not repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States the face order, winding, coordinates, UV default and the check.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F) for F faces, emitting and checking.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per rig.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the face, UV and corner arrays, O(F), which the cage record takes over; the edge set of `check` is released on return.
