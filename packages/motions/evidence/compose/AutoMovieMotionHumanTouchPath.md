# src/compose/AutoMovieMotionHumanTouchPath.ts#AutoMovieMotionHumanTouchPath.lay

## @evidence contracts/development/common.md#meaningful-documentation

States the direction, what it is read from and the fallback.

## @evidence contracts/development/implementation.md#principled-implementation

A hand laid on a surface keeps the wrist near neutral when its long axis continues the forearm; the forearm's direction is read from the elbow hanging under the shoulder, the place the elbow leaves least, or, for an arm held level, out to the side at the shoulder's height (`elbow: "level"`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One elbow place and one projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A direction shorter than 0.3 of the way across the normal falls back, so a near-parallel direction is never normalised.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the elbow place through `elbowOf`, the one `reach` shares, and `HumanFrame.point`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchPath.ts#AutoMovieMotionHumanTouchPath.reach

## @evidence contracts/development/common.md#meaningful-documentation

States the direction, how it differs from `lay` and the degenerate case.

## @evidence contracts/development/implementation.md#principled-implementation

A hand and wrist held straight continue the forearm, so the hand's long axis is the line from the elbow to what its end meets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One elbow place and one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The elbow place is the one `lay` reads, stated once in `elbowOf`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the elbow place with `lay`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
