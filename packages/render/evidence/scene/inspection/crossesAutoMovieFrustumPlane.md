# src/scene/inspection/crossesAutoMovieFrustumPlane.ts#crossesAutoMovieFrustumPlane

## @evidence contracts/development/common.md#meaningful-documentation

States the plane's inward-normal convention, which corner is tested, the slack and why, and its two consumers.

## @evidence contracts/development/implementation.md#principled-implementation

An axis-aligned box reaches past a plane exactly when its corner of least signed distance does, and that corner takes each coordinate from `min` or `max` by the sign of the normal's component; the 32-ulp slack, scaled by the magnitudes summed, absorbs the rounding of a corner lying on the plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test shared by the camera inspection's framing grade and the frame edge measure, which must agree on whether a subject crosses a side, instead of two private copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The slack is a stated rounding bound, not a tuned margin.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one corner, one dot product.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate with nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains and allocates nothing.
