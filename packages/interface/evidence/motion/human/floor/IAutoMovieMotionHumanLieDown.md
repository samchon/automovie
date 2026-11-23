# src/motion/human/floor/IAutoMovieMotionHumanLieDown.ts#IAutoMovieMotionHumanLieDown.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its default.

## @evidence contracts/development/design.md#principled-representation

A closed position and a hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No angle is typed by the author.

# src/motion/human/floor/IAutoMovieMotionHumanLieDown.ts#IAutoMovieMotionHumanLieDown.Position

## @evidence contracts/development/common.md#meaningful-documentation

A lying position.

## @evidence contracts/development/design.md#principled-representation

Closed choices "supine", "prone", "lateralLeft", "lateralRight", "sitLong", "sitCrossed", "sitSide" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: floor/lieDown.ts (lieDown.POSES); floor/lieDown.ts (lieDown.FOLDED); floor/lieDown.ts (lieDown.ROUTES); floor/lieDown.ts (lieDown.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in lieDown.POSES.

# src/motion/human/floor/IAutoMovieMotionHumanLieDown.ts#IAutoMovieMotionHumanLieDown.IPose

## @evidence contracts/development/common.md#meaningful-documentation

pitch: Forward tilt, degrees. roll: Tilt toward the right, degrees. joints: Clinical joint angles, degrees.

## @evidence contracts/development/design.md#principled-representation

pitch: Forward tilt, degrees. roll: Tilt toward the right, degrees. joints: Clinical joint angles, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: floor/crawlInchworm.ts (crawlInchworm.plan.prefer, return); floor/crawlInchwormPose.ts (crawlInchwormPose.of, return); floor/getUp.ts (getUp.quiet, return); floor/getUp.ts (getUp.keyed, return); floor/getUp.ts (getUp.mirrored, pose); floor/getUp.ts (getUp.mirrored, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanJoints.Angles identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
