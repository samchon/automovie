# src/compose/AutoMovieMotionHumanJoints.ts#AutoMovieMotionHumanJoints.channels

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the order of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The set of each bone's owning channel, listed in the writing order so the result is the same for any key order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One set and one filter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each channel appears once however many of its bones are named.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bones, with set membership for the nine channels.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieMotionHumanChannel.of` and `ORDER`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanJoints.ts#AutoMovieMotionHumanJoints.add

## @evidence contracts/development/common.md#meaningful-documentation

States what is added to what and when it throws. Writing copies held joints before reading this second's delta, then reads claimed channels separately for each added bone.

## @evidence contracts/development/implementation.md#principled-implementation

Each angle triple is summed with the joint's held triple, or with zero when the posture holds none.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy held joints, read the delta once, then check and add its entries in their original order. No second addition API or wrapper is required.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bone outside the claimed channels throws. The original copy-before-delta, per-bone channel lookup and final posture spread preserve getter/callback observations and the first thrown error.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the held joints and angles given; every original property/callback observation remains.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses AutoMovieMotionHumanChannel.covers. Construction's already required channels value also supplies read metadata without another props getter; writing still checks current props.channels per bone.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its props only and holds no per-second state.

# src/compose/AutoMovieMotionHumanJoints.ts#AutoMovieMotionHumanJoints.pulse

## @evidence contracts/development/common.md#meaningful-documentation

States the two windows, the span written and the channels claimed.

## @evidence contracts/development/implementation.md#principled-implementation

Angles that come and go are the peak scaled by the clock's envelope, which leaves and rejoins the base without a jump.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `add` with the scaled peak.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The channels are derived from the peak's own bones, so they cannot disagree with it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the peak's bones per written second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `add`, `channels` and the clock.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.
