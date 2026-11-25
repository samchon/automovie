# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutPoses.ts#IAutoMovieMotionHumanWorkoutPoses.Name

## @evidence contracts/development/common.md#meaningful-documentation

The exercises' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "calfStretch", "chestStretch", "tricepsStretch", "lungeTwist", "warriorOne", "triangle", "warriorTwo", "sunSalutation", "frontStance", "lowBlock", "risingBlock", "header", "chestTrap", "thighTrap", "spin", "underarmTurn", "hammerTurn", "closedHold" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutPoses.ts (WorkoutPoses.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in WorkoutPoses.KINDS.
