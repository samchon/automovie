# src/compose/AutoMovieMotionHumanArmBase.ts#AutoMovieMotionHumanArmBase

## @evidence contracts/development/common.md#meaningful-documentation

States what a base holds, what each arm's own view holds and why one hand's rest is no other arm's.

## @evidence contracts/development/implementation.md#principled-implementation

The obstacles are every goal's cleared segments and the rests the segments each hand is laid on, read on the hold alone; with two arms each reads a view of its own (`IBase.arms`): every goal's cleared segments and only its own goal's rests, so a segment one hand rests on (a steadying palm's presented hand, which the ring hand slides onto) is no obstacle or rest of the other arm unless a goal clears it, and the other arm itself is read as the crossing pair on its own course.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One union base, and with two arms one view each, built once per instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment a goal names is read by the arm that goal is for; none is dropped for a fixture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the goals' segments; the views are stable records, so the frames built on them are built once (`HumanArmFrame.of`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller keeps one base per instant, read however often the refinement asks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records of borrowed segments and retains nothing.
