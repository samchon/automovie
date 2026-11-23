# src/physics/computePhysicalKinematicFrames.ts#computePhysicalKinematicFrames

## @evidence contracts/development/common.md#meaningful-documentation

Names authored frame ownership and the optional admitted coupling context.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing output clock and authored frame producer, then resolves geometric relationships and groups on that frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each iteration binds the next frame before appending it to the cache.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An explicitly coupled target reaches admission even if its bindings are absent, and bind failures occur before frame publication.

## @evidence contracts/development/implementation.md#efficient-algorithms

Initializes geometry once when the scene has any geometric relationship or explicit group.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the same profiles and convex query owner for the entire kinematic run.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The frame writer borrows its run cache and report sink, and acquires no dynamics world.
