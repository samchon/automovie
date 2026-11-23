# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutLoad.ts#IAutoMovieMotionHumanWorkoutLoad.IParams

## @evidence contracts/development/common.md#meaningful-documentation

hand: The hand that holds it; `right` when absent. other: The prop's affordance the other hand takes (a bar's second handle); one hand holds when absent. handle: The prop's affordance the holding hand took, which with `other` gives the bar's own line; the line from the hand's grip to `other` when absent, which leaves a bar a few degrees out of level by the palm's depth.

## @evidence contracts/development/design.md#principled-representation

hand: The hand that holds it; `right` when absent. other: The prop's affordance the other hand takes (a bar's second handle); one hand holds when absent. handle: The prop's affordance the holding hand took, which with `other` gives the bar's own line; the line from the hand's grip to `other` when absent, which leaves a bar a few degrees out of level by the palm's depth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutLoad.ts (WorkoutLoad.of, load).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/exercise/IAutoMovieMotionHumanWorkoutLoad.ts#IAutoMovieMotionHumanWorkoutLoad.ILoad

## @evidence contracts/development/common.md#meaningful-documentation

apply: The posture with its hands on the load. contacts: The grip's contact window. holds: The hold the action leaves as it found it.

## @evidence contracts/development/design.md#principled-representation

apply: The posture with its hands on the load. contacts: The grip's contact window. holds: The hold the action leaves as it found it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/WorkoutLoad.ts (WorkoutLoad.of, return); exercise/workout.ts (workout.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionPropHold, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
