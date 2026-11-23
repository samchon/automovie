# src/motion/human/exercise/IAutoMovieMotionHumanExercise.ts#IAutoMovieMotionHumanExercise

## @evidence contracts/development/common.md#meaningful-documentation

count: Whole-number repetitions, at least one; 3 when absent. Unit: dimensionless. depth: A squat's depth; `parallel` when absent. tempo: Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent.

## @evidence contracts/development/design.md#principled-representation

count: Whole-number repetitions, at least one; 3 when absent. Unit: dimensionless. depth: A squat's depth; `parallel` when absent. tempo: Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.exercise, params); exercise/exercise.ts (exercise.plan, context); exercise/exercise.ts (exercise.drop, depth); exercise/exercise.ts (exercise.plan); executable/cases/exerciseCases.ts (exerciseCases); exercise/exercise.ts (exercise.THIGH).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/exercise/IAutoMovieMotionHumanExercise.ts#IAutoMovieMotionHumanExercise.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The exercise, the count, the depth, the tempo and the lead side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tempo is three seconds, as the issue's sketch writes it.

# src/motion/human/exercise/IAutoMovieMotionHumanExercise.ts#IAutoMovieMotionHumanExercise.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Capture cases of the standing exercises (#3245), three repetitions each from quiet standing. The exercises.

## @evidence contracts/development/design.md#principled-representation

Closed choices "squat", "lunge", "highKnees", "jumpingJack" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/exerciseCases.ts (exerciseCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in exerciseCases.

# src/motion/human/exercise/IAutoMovieMotionHumanExercise.ts#IAutoMovieMotionHumanExercise.Depth

## @evidence contracts/development/common.md#meaningful-documentation

The hips' drop of a squat to a depth. A squat's depth by name.

## @evidence contracts/development/design.md#principled-representation

Closed choices "quarter", "half", "parallel" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/exercise.ts (exercise.drop, depth); exercise/exercise.ts (exercise.THIGH); exercise/exercise.ts (exercise.PITCH); exercise/exercise.ts (exercise.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in exercise.drop.
