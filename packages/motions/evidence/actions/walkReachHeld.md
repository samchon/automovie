# src/actions/walkReachHeld.ts#walkReachHeld.tilt

## @evidence contracts/development/common.md#meaningful-documentation

States the hips pivot, world-metre geometry and added trunk angles.

## @evidence contracts/development/implementation.md#principled-implementation

The rigid turn from the upright heading to the tilted one, rotation times the upright's inverse, applied to each hip joint about the hips bone at the root plus its rotated rest offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One turn and one pivot serve both hip joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the body's rest hips bone and the posture's heading convention without a changed angle or position.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: two heading quaternions, one inverse and two joint rotations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the posture's heading owner; each call evaluates its own root, joints and trunk.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.
