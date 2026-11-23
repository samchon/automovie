# src/motion/human/daily/IAutoMovieMotionHumanPlayWindInstrument.ts#IAutoMovieMotionHumanPlayWindInstrument

## @evidence contracts/development/common.md#meaningful-documentation

Defines the held prop, optional holding side and the authored phase timings.

## @evidence contracts/development/design.md#principled-representation

Four phase durations describe the cue in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One prop, one side and four timing controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The mouthpiece is a prop affordance, so the author supplies no synthetic offset.

# src/motion/human/daily/IAutoMovieMotionHumanPlayWindInstrument.ts#IAutoMovieMotionHumanPlayWindInstrument.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the prop socket, default hand and the units and defaults of each phase.

## @evidence contracts/development/design.md#principled-representation

Phase durations are seconds on the action's clock. The law checks their bounds and resolves the holding hand and mouthpiece.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The wind-instrument law takes one held prop, one optional side and the phase timings used to plan the cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The target is resolved from the held prop's mouthpiece rather than supplied as a body-specific offset.
