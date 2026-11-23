# src/internal/validateHumanoidSkinning.ts#validateHumanoidSkinning

## @evidence contracts/development/implementation.md#principled-implementation

Matched VEC4 joint/weight counts drive each vertex read; individual negative weights throw before a finite positive sum establishes coverage.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mesh/skin pairs own weight admission, while the shared accessor reader owns stride, numeric decoding and resident views.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Negative weights cannot be hidden by cancellation with positive weights; malformed bindings throw without guessed or clamped influences.

## @evidence contracts/development/common.md#meaningful-documentation

Prose states nonnegative influence admission, positive finite total and the unresolved normalization/additional-set limits of this coverage pass.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is O(N plus unique bound mesh/skin vertex counts), with four weight reads and up to four joint-index reads per vertex, using expected constant-time membership sets.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated nodes binding the identical mesh/skin pair reuse completed checks within immutable synchronous inspection only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The per-call pair set and weighted-joint set scale with bindings and joints; no mesh bytes or running resources survive.
