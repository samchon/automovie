# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutFloor.ts#IAutoMovieMotionHumanWorkoutFloor.Name

## @evidence contracts/development/common.md#meaningful-documentation

The exercises' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "pushUp", "widePushUp", "plank", "mountainClimber", "burpee", "downwardDog", "cobra" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutFloor.ts (WorkoutFloor.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in WorkoutFloor.KINDS.
