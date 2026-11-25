# src/posture/HumanArmTrajectoryShapeOwners.ts#HumanArmTrajectoryShapeOwners

## @evidence contracts/development/common.md#meaningful-documentation

States the order and what each entry names.

## @evidence contracts/development/implementation.md#principled-implementation

`HumanArmShapes.colliders` places each collider's shapes in order, so the shape at an index rides the segment of the collider it came from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the colliders and their shapes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every shape gets its own entry, in the placement's order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the shapes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computed for the colliders it is given; nothing else to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the list is the caller's.

# src/posture/HumanArmTrajectoryShapeOwners.ts#HumanArmTrajectoryShapeOwners.Owner

## @evidence contracts/development/common.md#meaningful-documentation

States what the segment name means.

## @evidence contracts/development/design.md#principled-representation

The collider's own owner type, so the two cannot disagree.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An alias of the frame's member; nothing added.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No string stands for the segment.
