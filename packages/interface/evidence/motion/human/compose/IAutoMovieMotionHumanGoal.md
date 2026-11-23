# src/motion/human/compose/IAutoMovieMotionHumanGoal.ts#IAutoMovieMotionHumanGoal

## @evidence contracts/development/common.md#meaningful-documentation

from: Seconds since the action's start from which the limb is written. to: Seconds since the action's start until which the limb is written. origin: The goal at weight 0; the goal the posture so far holds when absent.

## @evidence contracts/development/design.md#principled-representation

from: Seconds since the action's start from which the limb is written. to: Seconds since the action's start until which the limb is written. origin: The goal at weight 0; the goal the posture so far holds when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanGoal.ts (AutoMovieMotionHumanGoal.toward, props); compose/AutoMovieMotionHumanGoal.ts (AutoMovieMotionHumanGoal.drive, props); compose/AutoMovieMotionHumanGoal.ts (AutoMovieMotionHumanGoal.pulse, goal); compose/AutoMovieMotionHumanGoal.ts (AutoMovieMotionHumanGoal.pulse, origin).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieHumanLimbGoal, AutoMovieHumanLimb identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanGoal.ts#IAutoMovieMotionHumanGoal.Frame

## @evidence contracts/development/common.md#meaningful-documentation

States what the function takes and returns.

## @evidence contracts/development/design.md#principled-representation

A goal that rides on the body or follows a path is a function of the posture so far and the time, evaluated when the row is written.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One function type, taken by `drive` and `pulse`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed goal is the constant function, so there is no second form for it.

# src/motion/human/compose/IAutoMovieMotionHumanGoal.ts#IAutoMovieMotionHumanGoal.IToward

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, its unit, its value when absent and the range of the weight.

## @evidence contracts/development/design.md#principled-representation

The limb, the span written, the two goals and the weight between them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members; the origin is optional because the posture so far usually holds the goal to leave.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The limb is the posture's own limb key, so one type serves arms and legs.
