# src/motion/resolveHydrodynamicForce.ts#resolveHydrodynamicForce

## @evidence contracts/development/implementation.md#principled-implementation

Archimedes' principle on a spherical cap and the quasi-steady quadratic drag of a sphere at its textbook subcritical coefficient, provisional; the stand-in sphere keeps the segment's volume, so buoyancy is exact at full immersion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The radius, the cap, then two forces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A segment above the water gets no force and one below gets its whole volume's; nothing is clamped beyond the cap's own range.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per segment.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the model, its source structure, the sphere stand-in with its cap volume, the buoyancy, the drag with its coefficient's source and the first pass's limits.
