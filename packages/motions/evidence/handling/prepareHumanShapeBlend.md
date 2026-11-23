# src/handling/prepareHumanShapeBlend.ts#prepareHumanShapeBlend

## @evidence contracts/development/common.md#meaningful-documentation

Defines the key union, the zero default, the blend formula and when the shapes are read.

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation per clinical axis; HumanPrehension owns the minimum-jerk timing and HumanPreshape the aperture bisection that feed it weights.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation of each bone's origin and difference, one loop per weight; the one linear joint-map blend owner for prepared schedules and one-off blends alike, read by the hand's prehension, the floor laws, the exercise keys and the mat landing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clipping, angle wrapping or tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(D) preparation for D bones, O(D) per weight.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The differences depend only on the two shapes, read at preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds D names, origins and differences until released, and no reference to either shape.
