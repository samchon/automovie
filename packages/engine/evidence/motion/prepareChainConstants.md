# src/motion/prepareChainConstants.ts#prepareChainConstants

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics composes a child's rest transform on its parent's world frame, so with identity articulation the chain's relative frames are its bones' rest transforms and its ranges are the rig's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three bone lookups, the adjacency test, then one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A chain the premise does not hold for returns null rather than an approximation; ranges come from `getConstraint` on the actual rig.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the bones for a rig and chain, in place of one forward-kinematics read of the whole pose per fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One record serves every pose and target of the unchanged rig, and its fit readers every fit that passes the tables given here; they are pure functions of the rig, those tables and this record.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The record copies its vectors and rotations and borrows the rig's constraint records, living as long as its owner keeps it.

## @evidence contracts/development/common.md#meaningful-documentation

States what is constant, why, what still comes from the pose and when the result is null.
