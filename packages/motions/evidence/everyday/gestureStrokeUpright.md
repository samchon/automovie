# src/everyday/gestureStrokeUpright.ts#gestureStrokeUpright

## @evidence contracts/development/common.md#meaningful-documentation

States the result's frame, each input's role and the refusal of a gesture that moves no hand; `gestureStroke`'s namespace doc gives each gesture's goal and its provisional values.

## @evidence contracts/development/implementation.md#principled-implementation

Builds each goal in the performer's heading frame from the body's own measure: a place of the air by its target-grid names (`AutoMovieMotionHumanTargetGrid.place`) times the stature, the half shoulder width and the arm, a hand turn by its named directions, and periodic strokes on `gestureSignal`; pointing and self-touch go to `gestureTouch`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exhaustive switch over the kind, moved from `gestureStroke` so the stroke's public readers keep their file; `gestureStroke.hand` lays the posed trunk's bend over the goal it returns.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arm-length shares, swing sizes and outward elbow shares are documented provisional values; no body or scene is special-cased. The `thumbsDown` knuckle tilt is a fixed 45 degrees read off the polygon man's thumb (Limitation: it should aim the fist's thumb down from the body's own digit direction).

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one frame preparation of the base's heading serves every point and direction of the call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one call, the points and directions share one frame preparation; nothing is kept between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new goal and retains nothing.
