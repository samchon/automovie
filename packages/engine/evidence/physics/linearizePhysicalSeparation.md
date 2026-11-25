# src/physics/linearizePhysicalSeparation.ts#linearizePhysicalSeparation

## @evidence contracts/development/implementation.md#principled-implementation

The distance derivative n dot (Jb-Ja) per witness pair (Drake) over the clipped contact patch (Ericson 2005; Gregorius 2015); the least of the patch points' linear separations is the first-order separation of a face patch in every direction, and equals the single witness's where the contact is a point; the signed distance is the greatest separation over directions, so a tied opposite side enters as a maximum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measure, take each tied side's patch, freeze its witnesses in bone frames, return the greatest side's least moved separation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tie band is the poses' roundoff scale, not a tuned tolerance; every patch point is kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

One measurement, two support queries and at most two patches per linearization; each probe costs one support-point transform per patch point.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure retains only the frozen witnesses and the measurement.

## @evidence contracts/development/common.md#meaningful-documentation

States the frozen normal, the patch, the least-point row, the tied opposite side, the tie band, the one-point fallback and the inactive row.
