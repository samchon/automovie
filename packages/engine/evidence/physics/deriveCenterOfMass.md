# src/physics/deriveCenterOfMass.ts#deriveCenterOfMass

## @evidence contracts/development/implementation.md#principled-implementation

Sum each supported primitive's volume-weighted centroid after part scale, rotation and translation, using positive scale product as the volume Jacobian. Density is uniform; articulated bone placement and overflowing weighted sums remain limitations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The part scan delegates formulas to primitiveVolume and primitiveCentroid, keeping aggregate weighting in this function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsupported mesh/plane and nonpositive volumes are omitted by the declared approximation; no consumer or expected center receives a special answer.

## @evidence contracts/development/common.md#meaningful-documentation

The comment documents model-local metres, uniform density, part TRS, ignored geometry and null when no positive mass proxy exists.

## @evidence contracts/development/implementation.md#efficient-algorithms

P parts require O(P) arithmetic and O(1) aggregate state; each supported part needs one centroid transform, not sampled surface geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Primitive formulas are shared canonical helpers; no aggregate cache survives mutable part geometry or transform changes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary vectors are call-owned and the resulting centroid transfers to the caller; no part history or handle is retained.
