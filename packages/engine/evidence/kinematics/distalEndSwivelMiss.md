# src/kinematics/distalEndSwivelMiss.ts#distalEndSwivelMiss

## @evidence contracts/development/common.md#meaningful-documentation

States what is bounded, the inequality, the distance in both cases, the interval rule, the tolerance and when the result is null.

## @evidence contracts/development/implementation.md#principled-implementation

The end joint's reachable directions are a latitude-longitude rectangle and the requested one a point on a circle, both from the same exact readings the refused arcs use (Tolani, Goswami and Badler 2000, after Korein); the bound is the point's spherical distance to the rectangle, Lipschitz in the point with constant one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared readings, the circle's radius, the distance at a swivel (`sphericalBoxMiss`), then the interval closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact distance at the middle and a certified slope, never a sampled minimum; a joint the analysis does not cover returns null rather than a guess.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three directions once; per interval one sine and cosine, two inverse functions inside the longitudes or four on the meridians.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The readings are `distalEndSwivelReadings`'s, shared with the refused arcs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure keeps the three sinusoids, the two intervals and the radius until its search returns.
