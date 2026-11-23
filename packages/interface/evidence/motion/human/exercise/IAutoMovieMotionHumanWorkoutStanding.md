# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutStanding.ts#IAutoMovieMotionHumanWorkoutStanding.Name

## @evidence contracts/development/common.md#meaningful-documentation

The exercises' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "deadlift", "backSquat", "kettlebellSwing", "overheadPress", "armCircles", "legSwings", "buttKicks", "bSkip", "jumpRope" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutStanding.ts (WorkoutStanding.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in WorkoutStanding.KINDS.
