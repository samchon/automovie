# src/architecture/designReferenceWorldPoint.ts#designReferenceWorldPoint

## @evidence contracts/development/implementation.md#principled-implementation

An affine map from the frame's 2D source units into 3D: subtract the anchor, scale by the settled metres-per-unit from `designFrameScale`, span by the normalized axes from the origin, then apply the optional TRS transform in scale, rotation, translation order; skew from non-orthogonal axes is kept, as the documentation states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function per point that reuses the shared scale lookup and the engine's vector and quaternion helpers rather than local copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no frame; an unsettled scale is refused instead of defaulting to one metre per unit.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact formula, the transform order, why axes are normalized and not orthogonalized, what a zero-length axis does, the units, and the thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(C) for the settled-scale lookup through C candidates, followed by a fixed number of vector and quaternion operations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Coordinates no work across calls; mapping multiple points repeats the candidate lookup for each point, with no bound on candidate count assumed here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates a few temporary vectors and retains nothing.
