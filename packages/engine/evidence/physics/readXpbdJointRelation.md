# src/physics/readXpbdJointRelation.ts#readXpbdJointRelation

## @evidence contracts/development/common.md#meaningful-documentation

States the frames and the normalisation.

## @evidence contracts/development/implementation.md#principled-implementation

The joint's relative rotation as the admission (projectPhysicalJointRotation) reads it: the parent's anchor frame inverted on the child's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compose the two anchor frames, normalise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one joint's present poses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh quaternion; retains nothing.
