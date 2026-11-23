# src/animals/EquineSwimPose.ts#EquineSwimPose

## @evidence contracts/development/common.md#meaningful-documentation

States the carriage, the angle conventions of each joint, what is preserved and the units.

## @evidence contracts/development/implementation.md#principled-implementation

Planar forward kinematics in the sagittal view: each bar's side-view direction is its parent's turned by the supplement of the included angle, and each bar is rotated about the lateral axis by the difference from its neutral direction, so lengths, attachments and twist are exact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy the neutral frames, raise the neck, pose four limbs proximal to distal, then express parent-local rotations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bar is stretched and no angle is clamped; the measured angles and authored slopes come from the stroke owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per bone, O(B) for the 23 bones.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh pose and retains nothing.
