# src/motion/human/next/IAutoMovieMotionHumanWorkout.ts#IAutoMovieMotionHumanWorkout

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Workout family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Workout laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanWorkout.ts#IAutoMovieMotionHumanWorkout.Kind

## @evidence contracts/development/common.md#meaningful-documentation

An exercise's name.

## @evidence contracts/development/design.md#principled-representation

Workout names are the union of the floor, equipment, gym, bodyweight, lying and standing vocabularies; those owners define the routines rather than a second copied string list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/workout.ts (workout.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanWorkoutFloor.Name, IAutoMovieMotionHumanWorkoutEquipment.Name, IAutoMovieMotionHumanWorkoutGym.Name, IAutoMovieMotionHumanWorkoutBodyweight.Name, IAutoMovieMotionHumanWorkoutLying.Name, IAutoMovieMotionHumanWorkoutStanding.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanWorkout.ts#IAutoMovieMotionHumanWorkout.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The exercise, the count, the hold, the prop borne and whether the body stays down.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The kind is a closed union; no angle is typed by the author.
