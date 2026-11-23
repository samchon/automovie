# src/motion/human/actions/IAutoMovieMotionHumanWalkCadence.ts#IAutoMovieMotionHumanWalkCadence.ICadence

## @evidence contracts/development/common.md#meaningful-documentation

foot: The foot that strikes on beat `index`; the left when absent, by drill custom. index: The beat the `foot`'s first strike answers; the beat nearest it when absent.

## @evidence contracts/development/design.md#principled-representation

foot: The foot that strikes on beat `index`; the left when absent, by drill custom. index: The beat the `foot`'s first strike answers; the beat nearest it when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkCadence.ts (walkCadence.strikes, cadence); actions/walkCadence.ts (walkCadence.beats, cadence).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in walkCadence.strikes.

# src/motion/human/actions/IAutoMovieMotionHumanWalkCadence.ts#IAutoMovieMotionHumanWalkCadence.IStrikesStrikes

## @evidence contracts/development/common.md#meaningful-documentation

seconds: Heel-strike instant in action-local seconds, in chronological order. side: Foot making this heel strike.

## @evidence contracts/development/design.md#principled-representation

seconds: Heel-strike instant in action-local seconds, in chronological order. side: Foot making this heel strike.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkCadence.ts (walkCadence.strikes, strikes).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in walkCadence.strikes.
