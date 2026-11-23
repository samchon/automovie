# src/perform/actorPointInModelSpace.ts#actorPointInModelSpace

## @evidence contracts/development/implementation.md#principled-implementation

Subtracts the frame position and applies the inverse quaternion, exactly inverting the reference staged translation-and-yaw transformation for admitted finite coordinates and a nonzero orientation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same inverse conversion serves locomotion, static reaches and live arm target samples without duplicating transform order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

This context represents rigid placement only; it does not flatten or approximate a nonuniform-scale affine transform.

## @evidence contracts/development/common.md#meaningful-documentation

States world/model metres, inverse rigid transform order, finite point/frame premises and absent scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant vector and quaternion arithmetic with fresh result values, independent of rig or scene size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Callers may reuse an unchanged frame for their action; the helper reads its supplied point and frame without a global identity cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned vector and intermediate values are call-local; no handle, task or retained geometry exists.
