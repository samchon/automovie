# src/carrier/HumanSwingPump.ts#HumanSwingPump

## @evidence contracts/development/common.md#meaningful-documentation

States the ride it wraps, the two postures, their timing and the sources.

## @evidence contracts/development/implementation.md#principled-implementation

The posture follows the sign of the seat's displayed velocity along the facing, read from the scene's seat, so it turns at the actual turning points.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan the seated ride, locate the turning points once, then blend the two postures per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The swing's angle is never authored here. The change time and knee angles are named provisional staging values.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass at `STEP` over the duration to find turning points; each sample does a binary search over them.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the seated ride's seat and grip fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the turning points and the ride plan for the action.
