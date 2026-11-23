# src/kinematics/aimYawPitch.ts#aimYawPitch

## @evidence contracts/development/implementation.md#principled-implementation

Inverse-heading rotation followed by atan2 yields quadrant-aware yaw and elevation; modulo 360 preserves heading periodicity and positive uniform rescaling preserves directions when finite differences overflow or rotated components risk overflow/subnormal precision loss. Exact zero offset has the stated zero-angle convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One geometric query beside `aimRotation`, called by the actor synthesizer's `lookAt` before `gazeChainJoints` splits the angles; how a rig carries them stays with that caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no rig or actor; non-finite input throws instead of being replaced, and the zero-offset answer is the stated convention for a direction that does not exist rather than a compensation.

## @evidence contracts/development/common.md#meaningful-documentation

States the heading convention, the yaw and pitch formulas with their ranges and signs, the zero-offset answer, the thrown message shape, and each parameter's unit and frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: seven input finiteness checks, three difference checks, bounded coordinate rescaling, one sine and cosine, one hypot and two atan2 calls; field-label strings and the returned angle record have fixed size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two points and a heading that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned pair.
