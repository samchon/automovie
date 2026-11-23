# src/motion/human/exercise/IAutoMovieMotionHumanRopeSkip.ts#IAutoMovieMotionHumanRopeSkip

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the cycle and its support and timing inputs.

## @evidence contracts/development/design.md#principled-representation

Separate period and flight durations describe the cadence and air phase in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ropeSkip planner consumes this type and owns its admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Supplies no solver, prop or callback.

# src/motion/human/exercise/IAutoMovieMotionHumanRopeSkip.ts#IAutoMovieMotionHumanRopeSkip.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Gives both durations in seconds, defaults and their relation.

## @evidence contracts/development/design.md#principled-representation

The period is longer than the flight so there is support time at both ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two authored time quantities suffice to derive all cycle instants.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The action law owns finite timing admission and phase derivation.
