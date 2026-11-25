# src/lexicon/coursePrecisionStroke.ts#coursePrecisionStroke

## @evidence contracts/development/common.md#meaningful-documentation

States the course's span, its speed bound and when the second hand joins it.

## @evidence contracts/development/implementation.md#principled-implementation

A moving hand goal is one trajectory problem with branch continuity and clearance (the planner's); the bound is the stroke's own delivery peak, and two hands on one implement are one problem, excused from each other only at the segments that grasp it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `courseArmGoal` call with the stroke's instants.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The goals, the span and the pace are the stroke's own; no constant is added to the pace and the planner's refusal stands.

## @evidence contracts/development/implementation.md#efficient-algorithms

The peak is read once, when the planner first asks for it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `courseArmGoal`, `AutoMovieMotionHumanArm.angles` and `precisionStrokePeak`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the plan and the peak once read, released with the coursed plan.
