# src/compose/AutoMovieMotionHumanRoot.ts#AutoMovieMotionHumanRoot.place

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the move and the turn.

## @evidence contracts/development/implementation.md#principled-implementation

The floor-frame transform of the offset by the heading the posture had, then the turn added, so the move does not depend on the turn of the same offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One transform and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every other member of the posture is kept as it is.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanFrame.point`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanRoot.ts#AutoMovieMotionHumanRoot.scale

## @evidence contracts/development/common.md#meaningful-documentation

States what is scaled and the share's two ends.

## @evidence contracts/development/implementation.md#principled-implementation

A displacement is linear in its translation and its turn, so a share of it scales both.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four products.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The share is not clamped: a caller that passes a clock's envelope already has a value in [0, 1], and an overshoot is the caller's to ask for.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanRoot.ts#AutoMovieMotionHumanRoot.travel

## @evidence contracts/development/common.md#meaningful-documentation

States what is displaced and the channel claimed.

## @evidence contracts/development/implementation.md#principled-implementation

Each second the offset is evaluated and applied to the posture so far.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `place`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Claims the root only; pitch and roll are the trunk's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `place`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its props only and holds no per-second state.

# src/compose/AutoMovieMotionHumanRoot.ts#AutoMovieMotionHumanRoot.excursion

## @evidence contracts/development/common.md#meaningful-documentation

States the two windows, the span written and that the root rejoins the base.

## @evidence contracts/development/implementation.md#principled-implementation

A body that leaves and returns is the displacement scaled by the clock's envelope, which is 0 at both ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `travel` with the scaled offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The windows are named instants of the clock, so no time is written twice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `travel`, `scale` and the clock.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanRoot.ts#AutoMovieMotionHumanRoot.shift

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, the window, the frame and unit, and how long the primitive holds.

## @evidence contracts/development/implementation.md#principled-implementation

A body carried from one place to another starts and ends at rest, so the displacement is scaled by the clock's minimum-jerk progress; the primitive runs to the clock's end because a moved body stays where it arrived.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `travel` with the scaled offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the displacement is the caller's. No law reads it yet; the steps and the seats rebuilt for #3286 are the consumers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `travel`, `scale` and the clock; `excursion` is the same offset on an envelope for a move that returns.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanRoot.ts#AutoMovieMotionHumanRoot.face

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, the window, the unit and sign, and how long the primitive holds.

## @evidence contracts/development/implementation.md#principled-implementation

A turn of the heading starts and ends at rest, so the angle is scaled by the clock's minimum-jerk progress and held to the clock's end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `travel` with the scaled offset, the same shape as `shift` with the angle in place of the displacement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the angle is the caller's, and the feet are not moved here, so a law that turns the body turns its feet with the leg phrases. No law reads it yet.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `travel`, `scale` and the clock.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.
