# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutHanging.ts#IAutoMovieMotionHumanWorkoutHanging.Name

## @evidence contracts/development/common.md#meaningful-documentation

The exercises' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "deadHang", "pullUp", "chinUp", "kneeRaise", "barSwing" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutHanging.ts (WorkoutHanging.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in WorkoutHanging.KINDS.
