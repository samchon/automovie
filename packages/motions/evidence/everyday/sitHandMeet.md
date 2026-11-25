# src/everyday/sitHandMeet.ts#sitHandMeet

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, on which grid, with which arm and legs, the meeting rule and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The body lowered as the sit lowers it, its legs at their course, the arm held at its entry angles (the arm a hand hangs by until its reach), and the audit's own segments placed (`HumanColliders.placed`, `AutoMovieMotionHumanAuditTangleModel`); the hand meets the thigh at the first instant a probe of either lies deeper in the other than its reference depth by more than the admission allows (`AutoMovieMotionHumanAuditTangleMargin.own`, both ways, against `HumanAuditModel.ALLOWANCE`, the depth the planner's pairs and the audit admit), so a hand that rests against its thigh as the body stands is not met by it. A seated person's hands land on the thighs as the thighs come up under them, which the sit then plans.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the plan's frame grid instants before the last second asked and that second itself, one placement and one excess reading each way per hand segment an instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The grid is the plan's own (`AutoMovieMotionHumanArmCourse.STEP`), the segments and offsets the audit's, the arm the entry's; no margin of its own. An unset entry angle is read as zero, the clinical rest.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan-time cost class: one posture resolve with closed-form legs, one collider placement and two probe-depth readings per hand segment per instant, stopping at the first meeting.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments at plan time.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.

# src/everyday/sitHandMeet.ts#ISitHandMeetProps

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its frame of seconds.

## @evidence contracts/development/design.md#principled-representation

The body, the sit's posture by its own seconds, the entry pose, the side and the last second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the meeting needs and nothing of the sit beyond its posture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
