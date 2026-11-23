# src/posture/HumanArmTrajectoryTravel.ts#HumanArmTrajectoryTravel.step

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the frames and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each point taken into its waypoint's base frame by the inverse of that frame's pose; their difference turned back by the later frame's rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two localisations and one rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A still base gives the world step exactly.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function with nothing to cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmTrajectoryTravel.ts#HumanArmTrajectoryTravel.back

## @evidence contracts/development/common.md#meaningful-documentation

States what the turn carries and its order.

## @evidence contracts/development/implementation.md#principled-implementation

The step's derivative in the earlier point is the later rotation after the earlier inverse, so a direction dotted with it is the earlier rotation after the later inverse applied to the direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A still base gives the identity.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function with nothing to cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
