# src/analysis/autoMovieSunDirection.ts#autoMovieSunDirection

## @evidence contracts/development/implementation.md#principled-implementation

Builds an orthonormal site frame: up from `ground.up`, north by Gram-Schmidt projection of `north` onto the ground plane, east as `north × up`, which is right-handed so north -Z and up +Y give east +X. The horizon direction is spherical-to-Cartesian in that frame. A north whose horizontal part is below 1e-6 of its length is refused, since its heading would be set by rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Kept apart from `solveAutoMovieSunPosition` because the solver answers an astronomical question in the observer's frame and this function answers how the set is oriented in world space.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No orientation is assumed; the parallel threshold is a stated degeneracy guard, not a tuned value.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the frame construction, the formula, how a staged sun light's direction follows by negation, the below-ground result and the parallel refusal.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time: a few vector operations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is independent and constant cost.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates a few vectors and retains nothing.
