# src/film/placeTransformedPoint.ts#placeTransformedPoint

## @evidence contracts/development/implementation.md#principled-implementation

The affine map `T + R(S·p)`, the composition order of glTF and `three.js` node transforms, evaluated with a quaternion rotation instead of a composed matrix; it relies on a unit rotation, which staging and model validation require.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placement rule shared by model-extent measurement and node subject boxes, so a part is placed for measurement exactly as its box is later placed in the world.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Applies every transform the same way with no special case for an identity or a uniform scale.

## @evidence contracts/development/common.md#meaningful-documentation

States the order of operations, who shares it and why one copy matters, the non-unit rotation effect, and the frames of input and output.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: three multiplications, one quaternion rotation and one addition, with no matrix built.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one transform and one point that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates two temporary vectors and retains nothing; the caller owns the returned point.
