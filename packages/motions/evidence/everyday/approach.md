# src/everyday/approach.ts#approach.plan

## @evidence contracts/development/common.md#meaningful-documentation

States what is planned, the arrival correction, the returned plan and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The stop is the proxemic gap (Hall) measured from the sternum region along the line to the target, the partner's own measure for the handing gap; the walk law places whole footprints to it, and one correction moves the stop by the arriving sternum's measured gap error, since the walk's arrival lean shifts the chest off the standing estimate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Computes the stop, then the waypoints through `abeam`, then delegates stepping to the walk law; the gap arithmetic lives in HumanProxemics and the chest lead in `chest`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 0.002 m acceptance of the arrival error and the single correction are the law's precision policy, not a tuned case; the 0.5 m clearance is the cited personal space (`CLEARANCE`); Effort modifiers are clamped to the walk's own parameter ranges (`walk.STRIDE_RANGE`, `walk.ARM_SWING_RANGE`, `walk.ELBOWS_RANGE`). The elbow modifier, an outward offset in upper-arm lengths, becomes the walk's added shoulder abduction by the arm's geometry: an upper arm abducted by an angle carries the elbow out by its length times the angle's sine, so the abduction is the arcsine of the offset over the upper arm, clamped to [-1, 1] (8.6 degrees for free flow's 0.15).

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two walk plans and one posture evaluation for the arrival check, plus one aim per avoided person, linear in the avoid list; a tracked person adds `HORIZON / REST_STEP` (120) reads of their placed root and four more for their way.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns the first walk plan when its arrival is within tolerance instead of planning again; nothing is shared across instances.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the returned walk plan, whose closures hold this instance's inputs and are released with the performance; the first plan is dropped when a corrected one replaces it.

# src/everyday/approach.ts#approach.chest

## @evidence contracts/development/common.md#meaningful-documentation

States the quantity, its reference points, the posture it is read on and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the sternum region on the stand law's own posture at the origin facing +Z, so the lead includes the body's upright alignment and lean exactly as standing places them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the posture to the stand law and the region to HumanTrunk; this function only differences the two points.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant or fitted value; the plan corrects any difference the walk's arrival posture makes by measurement.

## @evidence contracts/development/implementation.md#efficient-algorithms

One standing posture and one trunk forward-kinematics pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Called once per plan; nothing is cached, since it depends only on the body and is cheap.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
