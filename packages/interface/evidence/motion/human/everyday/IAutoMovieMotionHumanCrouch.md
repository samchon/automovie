# src/motion/human/everyday/IAutoMovieMotionHumanCrouch.ts#IAutoMovieMotionHumanCrouch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and its default.

## @evidence contracts/development/design.md#principled-representation

Two closed names and a hold; the knee flexion and the heel lift come from tables.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four optional members, all read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No height or angle is typed by the author.

# src/motion/human/everyday/IAutoMovieMotionHumanCrouch.ts#IAutoMovieMotionHumanCrouch.Depth

## @evidence contracts/development/common.md#meaningful-documentation

How deep: a parallel squat or a deep squat.

## @evidence contracts/development/design.md#principled-representation

Closed choices "partial", "full" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/crouch.ts (crouch.KNEE); everyday/crouch.ts (crouch.DESCENT); everyday/crouch.ts (crouch.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in crouch.KNEE.

# src/motion/human/everyday/IAutoMovieMotionHumanCrouch.ts#IAutoMovieMotionHumanCrouch.Heels

## @evidence contracts/development/common.md#meaningful-documentation

Whether the heels stay on the floor or rise about the toes' joints.

## @evidence contracts/development/design.md#principled-representation

Closed choices "flat", "up" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/crouch.ts (crouch.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in crouch.plan.
