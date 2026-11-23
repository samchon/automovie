# src/perform/resolveActorWorldFrame.ts#resolveActorWorldFrame

## @evidence contracts/development/implementation.md#principled-implementation

Samples once, rotates root translation by staged heading, adds staged position, composes rotations in staged-then-root order and projects rotated +Z to a degree heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses actorContextWorldFrame for the shared staged conversion instead of a second quaternion convention; motion interpolation remains with sampleMotion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Null is preserved rather than replaced with a fabricated live frame; arbitrary affine scale is outside the synthesis context and is not collapsed into this rigid result.

## @evidence contracts/development/common.md#meaningful-documentation

States shot-local seconds, world metres, root presence, composition order and absent scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

One motion sample plus constant vector/quaternion arithmetic; root sampling takes O(log K) segment selection for K keyframes and constant root interpolation and frame storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The sampled pose root serves both translation and orientation in this invocation; no duplicate sampling or cache across mutable motion inputs occurs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh frame values; motion/context inputs are borrowed and no retained pose cache, renderer or task is acquired.
