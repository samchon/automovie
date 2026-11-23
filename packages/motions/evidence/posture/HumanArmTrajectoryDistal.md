# src/posture/HumanArmTrajectoryDistal.ts#HumanArmTrajectoryDistal

## @evidence contracts/development/common.md#meaningful-documentation

Names the rotation frame, the mutable trial coordinates and the native clinical domains.

## @evidence contracts/development/implementation.md#principled-implementation

The native distal twist projection divides the requested world rotation between the actual forearm and wrist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One native projection writes the four returned angular coordinates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the rig's neutral for absent wrist axes and retains the caller's independent actual FK check.

## @evidence contracts/development/implementation.md#efficient-algorithms

One projection per oriented candidate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both analytic contact-circle and transport readers share the same projection owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes the caller's trial and retains nothing.
