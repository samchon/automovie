# src/terrain/crossingClearance.ts#crossingClearance

## @evidence contracts/development/common.md#meaningful-documentation

States the sampling, the allowances, the frame and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Broad-phase world bounds exclude distant pairs, then the engine's signed convex shape distance measures each remaining collider pair of the displayed pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares the fixtures once, then one pass over the sample times keeps the deepest entry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Checks the native shapes, not the root or a point, and grants the contact allowance only inside an actual bearing window on that fixture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Samples times colliders times fixture shapes bound tests, with exact distances only for overlapping bounds; one posture resolve per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each sample is a distinct posture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after it returns.
