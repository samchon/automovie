# src/motion/human/striking/IAutoMovieMotionHumanStrikingAim.ts#IAutoMovieMotionHumanStrikingAim.ITiming

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and meaning.

## @evidence contracts/development/design.md#principled-representation

Film-second instants and second durations; the contact's order after the launch is checked by the observation schedule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five values the schedule and the corrections read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingAim.ts#IAutoMovieMotionHumanStrikingAim.ITracker

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame, timebase and the causality it keeps.

## @evidence contracts/development/design.md#principled-representation

The planned goal in world metres and the corrections as functions of the film second, so no evaluation reads ahead of its second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The goal the reach solve reads and the units the stroke superposes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the engine's unit type.
