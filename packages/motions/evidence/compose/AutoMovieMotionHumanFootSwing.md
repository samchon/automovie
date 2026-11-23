# src/compose/AutoMovieMotionHumanFootSwing.ts#AutoMovieMotionHumanFootSwing

## @evidence contracts/development/common.md#meaningful-documentation

States the two profiles, the point the clearance is measured at and why, why each end has no slide, and the failure of a rise on the travel's share.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk travel for a point-to-point move with settled ends (Flash and Hogan 1985); the clearance is the sole's lowest point's, as the toe's minimum clearance is gait's measure of a swing (Winter 1992), read in closed form at the share's turn from the flat-toed sole's sockets and outline (`HumanFoot.lowest`). The half sine is a provisional shape, not a measured foot trajectory.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One share, one turn, one rise of the sole's lowest point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Time is held within 0 and 1, so the foot never passes either placement; the rise is only ever added, so no socket is lowered below the half sine's path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three sole reads a call: one at each end and one at the share's turn.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
