# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutKind.ts#IAutoMovieMotionHumanWorkoutKind

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is and its three parts. seconds: Seconds taken to reach it from the step before. hold: Seconds stayed in it.

## @evidence contracts/development/design.md#principled-representation

A route of keyed postures and a pin, so a push-up, a pull-up and a deadlift differ in data and share one planner. seconds: Seconds taken to reach it from the step before. hold: Seconds stayed in it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the workout law reads; the kind tables fill them. Runtime boundary references: exercise/WorkoutBodyweight.ts (WorkoutBodyweight.floor, base); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.floor, route); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.floor, return); exercise/WorkoutFeet.ts (WorkoutFeet.keep, kind); exercise/WorkoutGym.ts (WorkoutGym.pair, return); exercise/WorkoutHanging.ts (WorkoutHanging.kind, route).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The route is a function of the body, so an angle that must fit a body's lengths is solved from them. Shares the canonical IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanExerciseKey.IKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutKind.ts#IAutoMovieMotionHumanWorkoutKind.ISupport

## @evidence contracts/development/common.md#meaningful-documentation

part: The part. kind: How it bears. prop: Whether it bears on the workout's prop rather than the ground. at: The postures it bears in, every one when absent.

## @evidence contracts/development/design.md#principled-representation

part: The part. kind: How it bears. prop: Whether it bears on the workout's prop rather than the ground. at: The postures it bears in, every one when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/workout.ts (workout.plan.contacts, support); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.floor, supports); exercise/WorkoutFeet.ts (WorkoutFeet.keep.bearing, how); exercise/WorkoutFeet.ts (WorkoutFeet.keep.bearing, support); exercise/WorkoutStance.ts (WorkoutStance.of, supports); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.BACK).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutKind.ts#IAutoMovieMotionHumanWorkoutKind.IStep

## @evidence contracts/development/common.md#meaningful-documentation

seconds: Seconds taken to reach it from the step before. hold: Seconds stayed in it.

## @evidence contracts/development/design.md#principled-representation

seconds: Seconds taken to reach it from the step before. hold: Seconds stayed in it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/workout.ts (workout.plan.stayed, step); exercise/WorkoutBodyweight.ts (WorkoutBodyweight.KINDS, return); exercise/WorkoutEquipment.ts (WorkoutEquipment.KINDS, return); exercise/WorkoutFloor.ts (WorkoutFloor.KINDS, return); exercise/WorkoutGym.ts (WorkoutGym.pair, return); exercise/WorkoutGym.ts (WorkoutGym.KINDS, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanExerciseKey.IKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
