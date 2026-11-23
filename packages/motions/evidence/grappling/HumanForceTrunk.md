# src/grappling/HumanForceTrunk.ts#HumanForceTrunk.range

## @evidence contracts/development/common.md#meaningful-documentation

States what is summed and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The two trunk joints `HumanTrunkTurn` bends, each read from the body's own range table; a left bend is the negative abduction (`HUMANOID_JOINT_AXES`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sum over two joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint without a range adds none.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The range is the engine's `getConstraint` on the body's rig.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/grappling/HumanForceTrunk.ts#HumanForceTrunk.share

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the units and the bounds of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The moment is the stiffness integrated over the bend; each quarter adds its stiffness times its angle, and the share is where the sum meets the torque.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the four quarters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A torque past the whole range's moment returns the range's end, as `HumanTrunkTurn` takes it; no torque returns none.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
