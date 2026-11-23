# src/motion/human/compose/IAutoMovieMotionClock.ts#IAutoMovieMotionClock

## @evidence contracts/development/common.md#meaningful-documentation

An action clock resolving named instants and progress in seconds since that action starts. AutoMovieMotionClock constructs and admits the clock; action primitives share this capability.

## @evidence contracts/development/design.md#principled-representation

Progress between two named instants in the two forms a movement needs, uniform and minimum-jerk, plus the rise-and-fall envelope built from them and the instants as plan events.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMotionClock.of owns construction and named-window admission; all human action primitives consume the resulting clock instead of implementing separate timing maps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The runtime constructor rejects repeated/reserved names and out-of-duration instants; query methods reject unknown names. This pure capability retains no validator metadata.
