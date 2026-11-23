# src/compose/AutoMovieMotionHumanTouchLaid.ts#AutoMovieMotionHumanTouchLaid.bend

## @evidence contracts/development/common.md#meaningful-documentation

States when and on what the hint is solved.

## @evidence contracts/development/implementation.md#principled-implementation

The least-strain elbow place of `AutoMovieMotionHumanBend.solve` for the goal at the entry, the hanging arm's where it refuses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal and one solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Solved once, so the swivel cannot flip between seconds.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the effector's goal and the bend solver.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded swivel sweep per touch.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchLaid.ts#AutoMovieMotionHumanTouchLaid.laid

## @evidence contracts/development/common.md#meaningful-documentation

States when and on what the arm is solved and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

A limb fit has more than one arm for one hand place; a fit referred to one arm solved once returns the arm nearest it, so the seconds of a touch share a solution branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal (`rest`) and its reference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arm is the posture resolver's own, through `reference`, which keeps the forearm's twist inside its range.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the laid goal (`rest`) and `reference`.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve per touch.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchLaid.ts#AutoMovieMotionHumanTouchLaid.rest

## @evidence contracts/development/common.md#meaningful-documentation

States what is laid, where, and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The effector's pad stands off the region along its normal and the effector lies as the touch lays it (`lie`), so the goal is the arm a stroke's every second is held to.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One tangent, one stand-off and one effector goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No lift or travel is added: they are a stroke's, not the region's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the effector's goal and pad and the form's tangent.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchLaid.ts#AutoMovieMotionHumanTouchLaid.settled

## @evidence contracts/development/common.md#meaningful-documentation

States the two unknowns, why they depend on each other, what is returned and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A fixed-point iteration from the elbow the body's measures give: rounds of the goal a hand from that elbow asks and the elbow that goal's wrist bends at, until the elbow moves less than the swivel resolution swept on the upper arm; the round bound is the halvings of two upper arms down to that tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop of `rest` and one elbow solve, stopped by the tolerance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance and the bound are derived from the solver's resolution and the arm, so the result is a function of its inputs alone; an elbow that does not settle is refused, never returned unsettled.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded swivel sweep a round, as many rounds as the elbow takes to settle and at most the derived bound.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `rest` and the bend solver.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchLaid.ts#AutoMovieMotionHumanTouchLaid.lie

## @evidence contracts/development/common.md#meaningful-documentation

States each lay's two directions, every input and the two fall-backs.

## @evidence contracts/development/implementation.md#principled-implementation

An effector's attitude is two directions, the one it presses against and the one its along axis follows; each lay names where the second comes from (the travel, the arm by `AutoMovieMotionHumanTouchPath.lay`, the elbow's line by `AutoMovieMotionHumanTouchPath.reach`, or the world's up for a vessel that must stand).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per lay, each returning the pair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A direction that has no part across the line it must cross falls back to the travel instead of normalizing a zero vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the arm's and the elbow's directions to `AutoMovieMotionHumanTouchPath`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
