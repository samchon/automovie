# src/motion/human/everyday/IAutoMovieMotionHumanKneel.ts#IAutoMovieMotionHumanKneel.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and its default.

## @evidence contracts/development/design.md#principled-representation

A closed kind, a side, a hold, whether to rise and an optional knee target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seven optional members, all read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No angle is typed by the author; a knee place is a motion target the scene resolves.

# src/motion/human/everyday/IAutoMovieMotionHumanKneel.ts#IAutoMovieMotionHumanKneel.Kind

## @evidence contracts/development/common.md#meaningful-documentation

On one knee, on both knees upright, or sitting back on the heels.

## @evidence contracts/development/design.md#principled-representation

Closed choices "one", "both", "sitBack" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/kneel.ts (kneel.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in kneel.plan.
