# src/geometry/sweep/momentAutoMovieSweepSections.ts#momentAutoMovieSweepSections

## @evidence contracts/development/implementation.md#principled-implementation

The section integrals of the swept-volume formula of sweep-based deformation (Hyun et al. 2005, The Visual Computer 21(8-10):542-550, Section 3.1) with the first-moment terms of an off-centre section, by the midpoint rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pose-invariant half of the volume, read from the shape before the scale, so posing never repeats it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The quadrature is fixed, not adapted to a sweep.

## @evidence contracts/development/common.md#meaningful-documentation

States the integrals, the quadrature, the scale law and the layout.

## @evidence contracts/development/implementation.md#efficient-algorithms

400 * 256 profile queries, each a cached-row read for a sweep without features, with each direction's cosine and sine computed once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per compiled sweep; the result is the reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; two 256-number direction tables are released on return and the 1,200-number result is transferred to the caller.
