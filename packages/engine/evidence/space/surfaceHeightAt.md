# src/space/surfaceHeightAt.ts#surfaceHeightAt

## @evidence contracts/development/implementation.md#principled-implementation

An explicit constant, plane or edge-clamped bilinear heightfield takes precedence; otherwise the legacy anchor/ramp projection extrapolates a plane, with squared XZ span below 1e-9 treated as flat.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placement, motion, camera and surface tessellation share this height owner, while callers separately decide whether the query lies on the surface.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absent anchor returns zero and absent heightfield samples return zero; these malformed-input fallbacks are not admission, and finite fields alone do not prevent overflow in derived arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

Documents metre heights, explicit-rule precedence, edge clamping, extrapolated ramps and the square-metre degeneracy threshold rather than a linear-span threshold.

## @evidence contracts/development/implementation.md#efficient-algorithms

A height query uses constant scalar work and at most four indexed lattice samples regardless of grid population; no grid scan or emitted geometry is allocated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All consumers reuse the same rule implementation and supplied grid; no scalar-height or mutable-grid result cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a number escapes; local cell records leave scope and the borrowed surface/grid is not retained by the query.
