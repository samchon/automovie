# src/tasks/wipe.ts#wipe.circle

## @evidence contracts/development/common.md#meaningful-documentation

States each input's frame and unit and the returned world point.

## @evidence contracts/development/implementation.md#principled-implementation

The phase `2 pi cycles progress` on a circle of the radius about the centre, starting at its point nearest the performer, in the heading's floor frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local circle (`localCircle`) and one floor-frame transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The point is computed for any progress, never sampled or clamped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plan's own circle uses the same `localCircle`, so the case kit's check and the stroke agree.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/tasks/wipe.ts#wipe.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the refusals and the plan; the namespace gives the goal, the stroke, the lean, the timing and the sources.

## @evidence contracts/development/implementation.md#principled-implementation

The palm's goal is its place on the circle at the stroke's progress, laid flat with the fingers ahead; a patch beyond the standing arm is leaned into by the least pitch that keeps the wrist within `REACH` (`AutoMovieMotionHumanLeanInto`), checked at plan time over one whole circle; the reach takes the aimed movement time of the hand's way to the circle's start, onto the patch the circle covers (McIntosh et al. 2018).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Circle and palm geometry, the lean with its refusal, the entry hand, the clock, then the lean and the planted stroke.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A patch out of reach at the lean's limit is refused, never clamped; the palm is planted on the surface's own support.

## @evidence contracts/development/implementation.md#efficient-algorithms

The heading's frame and the palm's alignment are prepared once; the plan-time reach check reads nine places of one circle, each a wrist read with no elbow search; each stroke second costs one palm target.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The circle (`localCircle`), the frame (`HumanFrame.prepare`) and the palm targets (`AutoMovieMotionHumanTarget.prepareHand`, `HumanHandTarget.prepareFrame`) are prepared once for the plan's fixed hand, surface and heading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the prepared geometry and the lean for its lifetime; nothing grows with the seconds evaluated.
