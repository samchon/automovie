# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutPlace.ts#IAutoMovieMotionHumanWorkoutPlace.IOfProps

## @evidence contracts/development/common.md#meaningful-documentation

context: Borrowed body and entry state used to find an admissible exercise placement. borne: World-space point, metres, on which weight is borne; null means no externally supplied bearing point.

## @evidence contracts/development/design.md#principled-representation

context: Borrowed body and entry state used to find an admissible exercise placement. borne: World-space point, metres, on which weight is borne; null means no externally supplied bearing point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutPlace.ts (WorkoutPlace.of, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanWorkoutKind, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanExerciseKey.IKey, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
