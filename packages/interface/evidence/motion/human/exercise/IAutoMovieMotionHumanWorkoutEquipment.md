# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutEquipment.ts#IAutoMovieMotionHumanWorkoutEquipment.Name

## @evidence contracts/development/common.md#meaningful-documentation

The exercises' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "stepUp", "inclinePushUp", "declinePushUp", "hipThrust" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutEquipment.ts (WorkoutEquipment.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in WorkoutEquipment.KINDS.
