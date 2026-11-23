# src/dressing/HumanWornItem.ts#HumanWornItem.point

## @evidence contracts/development/common.md#meaningful-documentation

States the frames and units.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid transform of the point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/dressing/HumanWornItem.ts#HumanWornItem.holding

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, frames and result.

## @evidence contracts/development/implementation.md#principled-implementation

Inverts the rigid held offset: the hand's rotation from the item's, the grip socket from the item's origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation, one point, one target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The held offset is the one the entry read.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/dressing/HumanWornItem.ts#HumanWornItem.grasping

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the grasp's orientation and the result.

## @evidence contracts/development/implementation.md#principled-implementation `HumanHand.align` turns the grip socket's rest frame onto the handle's: the palm against its `+Y`, the forward along its `+X`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The handle's world frame, then the rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The handle's frame is the item's declared one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
