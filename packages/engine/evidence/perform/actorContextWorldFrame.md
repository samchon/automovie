# src/perform/actorContextWorldFrame.ts#actorContextWorldFrame

## @evidence contracts/development/implementation.md#principled-implementation

Converts the context's degree heading to an axis-angle quaternion about +Y, where zero faces +Z; the context supplies an admitted finite position and heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This one conversion is shared by the reference synthesizer and live actor-frame resolver, keeping their staged heading convention identical.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There is no node-specific heading adjustment or inferred scale; arbitrary staged affine transforms are outside this context's representation.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed staged metre position, fresh quaternion, +Y degree heading and absent scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and one frame plus quaternion allocation; no skeleton traversal or sampling is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumers may hold the frame for one unchanged context; the helper has no identity cache and reads each supplied context afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned frame and borrowed position lifetime; no handle, task or retained map is acquired.
