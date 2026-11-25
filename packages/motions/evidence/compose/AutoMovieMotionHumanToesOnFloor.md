# src/compose/AutoMovieMotionHumanToesOnFloor.ts#AutoMovieMotionHumanToesOnFloor.bend

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the fade and the units.

## @evidence contracts/development/implementation.md#principled-implementation

The metatarsophalangeal joint extends by the heel's rise in the forefoot rocker, so the toes stay on the floor (Perry and Burnfield, Gait Analysis: the forefoot rocker); above it the toes, turning about the ball, bend by the closed-form arcsine excess of the tip's angle below the ball over the one that reaches the support.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lift, one fade, one tip bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fade height is provisional and named.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanFoot`, the one owner of the foot's points and pitch.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanToesOnFloor.ts#AutoMovieMotionHumanToesOnFloor.row

## @evidence contracts/development/common.md#meaningful-documentation

States what is added to the row.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the foot the row's goal places, so the bend follows the heel the row raised.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One wrapper over the row's write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A goal without a foot rotation, or no bend, leaves the row's posture as it was.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work a write.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `bend`, the one reading of the toes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the row and the floor reader with the plan.
