# src/posture/humanLimbReference.ts#humanLimbReference

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The limb's upper and lower joints' clinical angles as the pose has them, zero for an unset joint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain lookup and two joint reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unset angle reads the joint's clinical zero, as forward kinematics reads it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the pose's joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh tuples.
