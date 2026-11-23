# src/compose/AutoMovieMotionHumanGoal.ts#AutoMovieMotionHumanGoal.mix

## @evidence contracts/development/common.md#meaningful-documentation

States both ends, the clamp, the middle and when it throws.

## @evidence contracts/development/implementation.md#principled-implementation

Points interpolate on lines and the rotation on the sphere; the plant is dropped because a moving limb bears on nothing, and the contact, the frame and the reference are the asked goal's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two early returns for the ends, one frame check and one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ends return the given goals themselves, so a plant held at an end is kept; a rotation only one goal states is held, not interpolated from an invented one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse beyond the engine's interpolation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanGoal.ts#AutoMovieMotionHumanGoal.toward

## @evidence contracts/development/common.md#meaningful-documentation

States each input and when it throws.

## @evidence contracts/development/implementation.md#principled-implementation

The origin is the stated one or the goal the posture so far holds, mixed with the asked goal by the weight of the second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One origin choice and one mix.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A limb with no goal to leave throws instead of starting from an invented one.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `mix`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanGoal.ts#AutoMovieMotionHumanGoal.drive

## @evidence contracts/development/common.md#meaningful-documentation

States what is driven, for which limbs it is meant and the channel claimed.

## @evidence contracts/development/implementation.md#principled-implementation

Each second the driven goal replaces the limb's goal on the posture so far.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal written into one limb.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Writes its own limb only and leaves every other member of the posture as it is.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `toward`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its props only and holds no per-second state.

# src/compose/AutoMovieMotionHumanGoal.ts#AutoMovieMotionHumanGoal.pulse

## @evidence contracts/development/common.md#meaningful-documentation

States the two windows, the span written, the default origin and the scale's range.

## @evidence contracts/development/implementation.md#principled-implementation

A limb that goes and returns is the clock's envelope over a rise and a fall, scaled for a movement that stops short of its goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `drive` with the scaled envelope as the weight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absent origin is left absent, so `toward` reads the posture's own goal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `drive` and the clock.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.
