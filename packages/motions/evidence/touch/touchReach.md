# src/touch/touchReach.ts#touchReach.duration

## @evidence contracts/development/common.md#meaningful-documentation

States entry/reached frames, ordered hand-target demand, anatomical effector, region/lay readers and seconds output; region may borrow current same-body FK/ROM metadata.

## @evidence contracts/development/implementation.md#principled-implementation

Each actual laid goal is solved by the original full posture resolver, and the original arm travel calculation compares entry and arrival angles before strict longest-duration selection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered hand loop reads each hand's region and lay and compares durations; goal creation, the complete fit and the travel bound are the one arm-onto-place measurement `place` shares; lazy fixed-body metadata is local to this synchronous query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hand, target, goal, rival clearance, authored admission, ROM clamp or physical travel bound is skipped or approximated, and an empty hand list still returns zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

H hands retain H physical fits and H travel calculations; one lazy genuine ROM projector and exact FK workspace remove repeated fixed preparation, with no measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit query fixes one canonical body and reached posture while complete per-hand goals vary. Only genuine same-body metadata reaches the region and native fit; changed targets and poses are actually queried.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Metadata is created only for a real hand and released on return or throw. No goal, pose, map, projector, query callback or history escapes the scalar duration result.

# src/touch/touchReach.ts#touchReach.meeting

## @evidence contracts/development/common.md#meaningful-documentation

States the two times taken and when the arm's is read.

## @evidence contracts/development/implementation.md#principled-implementation

The free-space time of the hand's distance, raised to the arm's own reach where the arc is longer than that time allows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance, one arm reach, their larger.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A role whose posture is not known keeps the free-space time.

## @evidence contracts/development/implementation.md#efficient-algorithms

One frame read and `place`'s one posture solve and arc.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each role is timed once by its meeting.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/touch/touchReach.ts#touchReach.place

## @evidence contracts/development/common.md#meaningful-documentation

States the two ends, the region the point is read as and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The arm laid on the point as `duration` lays it on a region, solved by the posture resolver, and the observation's travel bound between it and the entry's arm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One level normal, then the arm-onto-place measurement `duration` shares: one goal, one solve, one travel bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arc is the arm's fitted blend, never the hand's straight distance; a point at the performer's own place has no level normal and is faced forward.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve and the observation's arc samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each meeting role is measured once by its caller.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
