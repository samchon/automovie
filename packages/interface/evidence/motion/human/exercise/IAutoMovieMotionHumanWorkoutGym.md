# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutGym.ts#IAutoMovieMotionHumanWorkoutGym

## @evidence contracts/development/common.md#meaningful-documentation

The gym's standing movements of the workout law: free-weight exercises a programme names beside the ones the other tables hold, shown here without their load unless the author names one (`load`): the bent-over row, the curl, the overhead triceps extension, the lateral and the front raise, the shrug, the calf raise, the front and the goblet squat, the split squat, the wall sit, the Romanian deadlift, the good morning, and the power clean and the snatch as their phases. The floor exercises and the dip are `WorkoutBodyweight`'s.

## @evidence contracts/development/design.md#principled-representation

Closed choices "bentOverRow", "curl", "tricepsExtension", "lateralRaise", "frontRaise", "shrug", "calfRaise", "frontSquat", "gobletSquat", "splitSquat", "wallSit", "romanianDeadlift", "goodMorning", "powerClean", "snatch" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutGym.ts (WorkoutGym.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in WorkoutGym.KINDS.

# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutGym.ts#IAutoMovieMotionHumanWorkoutGym.Name

## @evidence contracts/development/common.md#meaningful-documentation

The exercises' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices include a power clean, a clean and squat jerk and a snatch as distinct phase routes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutGym.ts (WorkoutGym.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in WorkoutGym.KINDS.
