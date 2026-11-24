# src/compose/AutoMovieMotionHumanFootRelax.ts#AutoMovieMotionHumanFootRelax.load

## @evidence contracts/development/common.md#meaningful-documentation

States the contact state it returns and when.

## @evidence contracts/development/implementation.md#principled-implementation

The plant's own contact state, which the binary dorsal limit is read by (`walkLeg.dorsal`): no study relates the limit to a partial load, so no ramp is drawn between the two.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exactly 0 at the landing and the lift, as the window's edges are.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The walk's binary dorsal limit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanFootRelax.ts#AutoMovieMotionHumanFootRelax

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the correction.

## @evidence contracts/development/implementation.md#principled-implementation

The hip joint from the posture's root, heading and pelvis; the closed-form lean's excess over the contact state's dorsal limit (`walkLeg.dorsal`, binary: Konor et al. 2012 loaded, AAOS unloaded) taken off the pitch about the toes' joint, re-read from the moved ankle a fixed number of times. Remaining, listed for the next change: the walk's margin and the fixed passes, which an exact read of the rig's ankle chart replaces.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Hip, limit, rocker, pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foot within the limit is returned unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hip read and at most PASSES closed-form leans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The walk's lean, margin and dorsal limit, the shared hip reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
