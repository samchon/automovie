# src/lexicon/HumanSportWorkoutBarSwing.ts#HumanSportWorkoutBarSwing

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes for `HumanSportWorkout` and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The same computation `HumanSportWorkout` made in place, moved unchanged to its own file.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `HumanSportWorkout`, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanSportWorkout`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanSportWorkout` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads what `HumanSportWorkout` reads instead of computing it again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as its caller holds it.
