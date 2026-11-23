# src/dressing/dress.ts#dress.place

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the workspace's role, the result's frame and each item's surface and facing.

## @evidence contracts/development/implementation.md#principled-implementation

A hat's palm goes where a ray from outside the head, aimed at the crown's axis from the front quarter (`HAT`), meets the head's own surface a head radius below the crown; a pair of glasses' index tip goes on the ear region, pointing back along the temple, the palm facing ahead.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The heading's frame, then one branch per item.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every place is read on the given posture's own head; the ray starts four head radii out, outside any head the body builds, so it meets the surface from outside.

## @evidence contracts/development/implementation.md#efficient-algorithms

One heading frame and one trunk resolve per call (the hat's region and surface read the same resolve; the glasses read one region).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanTrunk` for the region and the surface ray and the caller's pose workspace.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function whose result is fresh numbers.

# src/dressing/dress.ts#dress.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the refusals and the result; the namespace gives the places, the stroke, the timing, the wearing and the supporting hand.

## @evidence contracts/development/implementation.md#principled-implementation

The wearable is rigid in the hand (`AutoMovieMotionHumanHeld`), so the hand's goal at every second is the worn frame on that second's head region with the hold undone (`dressTurn.carried`); a hat's turn about the crown is chosen once by the fitted arm's miss (`dressTurn`); the other hand's goal is its place read on the same posture (`place`); the reach time is the free-space movement time of the farther hand's way to a place before the face (`AutoMovieMotionHumanTiming.of`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Hold, entry hands, turn, timing, the carrying and the supporting strokes, then the grip and wear windows with the kept fingers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal is read on the posture of its own second; the hold is the hand's own, never a typed offset. A pair of glasses takes no turn, since it faces the body's way.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry pose read for the two hand surfaces, one turn search for a hat (`dressTurn`), then per stroke second one worn-frame read, one elbow hint and the supporting hand's place.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The wearable's socket and the region's reader are bound once for the stroke (`HumanWorn.prepareMoving`), as are the target builders of both hands; each second's posture is read anew.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the hold, the clock, the fingers and the prepared readers for its lifetime; nothing grows with the seconds evaluated.
