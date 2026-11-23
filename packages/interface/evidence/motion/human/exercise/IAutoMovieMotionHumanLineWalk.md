# src/motion/human/exercise/IAutoMovieMotionHumanLineWalk.ts#IAutoMovieMotionHumanLineWalk

## @evidence contracts/development/common.md#meaningful-documentation

on: The prop and its affordance the line runs along. to: Where along the line the walk stops, world metres. steps: How many steps; the fewest heel-to-toe steps that reach `to` when absent.

## @evidence contracts/development/design.md#principled-representation

on: A scene id and an affordance id. to: A world point projected on the line. steps: A positive whole number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/lineWalk.ts (lineWalk.plan, context); lexicon/HumanGymnastics.ts (HumanGymnastics.lineWalk, params).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No step length is authored: it is the foot's.

# src/motion/human/exercise/IAutoMovieMotionHumanLineWalk.ts#IAutoMovieMotionHumanLineWalk.IOn

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

A scene id and one of its affordance ids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two ids the plan resolves.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/exercise/IAutoMovieMotionHumanLineWalk.ts#IAutoMovieMotionHumanLineWalk.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The line, the stopping point and an optional step count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The step count is derived unless authored.
