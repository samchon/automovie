# src/motion/human/exercise/IAutoMovieMotionHumanExerciseKey.ts#IAutoMovieMotionHumanExerciseKey.IKey

## @evidence contracts/development/common.md#meaningful-documentation

pitch: Forward tilt of the whole body, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical from the heading the exercise is entered on, degrees.

## @evidence contracts/development/design.md#principled-representation

pitch: Forward tilt of the whole body, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical from the heading the exercise is entered on, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.standing, return); exercise/ExerciseKey.ts (ExerciseKey.from, return); exercise/prepareExerciseKeyBlend.ts (prepareExerciseKeyBlend, a); exercise/prepareExerciseKeyBlend.ts (prepareExerciseKeyBlend, b); exercise/prepareExerciseKeyBlend.ts (prepareExerciseKeyBlend, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanJoints.Angles identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/exercise/IAutoMovieMotionHumanExerciseKey.ts#IAutoMovieMotionHumanExerciseKey.ITrunk

## @evidence contracts/development/common.md#meaningful-documentation

pitch: Forward tilt, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical, degrees.

## @evidence contracts/development/design.md#principled-representation

pitch: Forward tilt, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.from, trunk); exercise/WorkoutGym.ts (WorkoutGym.key, trunk); exercise/WorkoutStance.ts (WorkoutStance.stride, trunk).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in ExerciseKey.from.

# src/motion/human/exercise/IAutoMovieMotionHumanExerciseKey.ts#IAutoMovieMotionHumanExerciseKey.ILimb

## @evidence contracts/development/common.md#meaningful-documentation

hip: Hip flexion, degrees. spread: Hip abduction, degrees. turn: Hip rotation, degrees.

## @evidence contracts/development/design.md#principled-representation

hip: Hip flexion, degrees. spread: Hip abduction, degrees. turn: Hip rotation, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.from, both); exercise/ExerciseKey.ts (ExerciseKey.from, left); exercise/ExerciseKey.ts (ExerciseKey.from, right).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in ExerciseKey.from.

# src/motion/human/exercise/IAutoMovieMotionHumanExerciseKey.ts#IAutoMovieMotionHumanExerciseKey.Pin

## @evidence contracts/development/common.md#meaningful-documentation

What bears a key: a bone's origin, or a hand's grip socket, the centre of a fist closed on a bar.

## @evidence contracts/development/design.md#principled-representation

Closed choices "gripLeft", "gripRight" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.mean, bones); exercise/ExerciseKey.ts (ExerciseKey.at, pin); exercise/ExerciseKey.ts (ExerciseKey.pinned, pin); exercise/WorkoutPlace.ts (WorkoutPlace.of.shown, pin); exercise/WorkoutPlace.ts (WorkoutPlace.of.soles, bone); exercise/WorkoutPlace.ts (WorkoutPlace.of.grounded, bone).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
