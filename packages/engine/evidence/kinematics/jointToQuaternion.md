# src/kinematics/jointToQuaternion.ts#jointToQuaternion

## @evidence contracts/development/implementation.md#principled-implementation

An intrinsic Euler composition of three axis-angle quaternions in a declared order, which is a rotation for any orthonormal basis; `normalizeJointAxes` enforces that basis and the frame map is the exact affine inverse of `toClinicalAngle`, so `decomposeJointRotation` round-trips it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The forward half of the joint convention, used by `resolvePose` for every articulated bone: `jointToQuaternionOnBasis` behind one `normalizeJointAxes`, so basis checking and composition each live in one place and the forward and inverse maps share those rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads every bone through its declared axes and frame; a `null` angle is the documented rest rotation, and a non-finite angle throws instead of becoming zero.

## @evidence contracts/development/common.md#meaningful-documentation

States each axis and its default, the three composition orders and when each applies, what `null` means, the frame map and its purpose, the inverse function, the thrown inputs, and each parameter's default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one basis admission (a remembered record costs ten comparisons), three axis-angle quaternions and two products.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one joint that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned quaternion.
