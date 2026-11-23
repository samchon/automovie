# src/motion/placeChainPlant.ts#placeChainPlant

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the frame and the equivalence to `prepareChainPlant`.

## @evidence contracts/development/implementation.md#principled-implementation

The parent-first composition of forward kinematics with identity articulation: each bone's world rotation is its parent's times its rest rotation and its place its parent's plus the parent-turned rest translation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The root bone, the mid bone, the end point and the hinge, in that order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is approximated: the same products forward kinematics takes, on the same rest transforms.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two quaternion products and four vector rotations, with no pose admission and no walk of the skeleton.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The constants are shared by every pose of the rig; only the parent frame is read per pose, by its caller.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.
