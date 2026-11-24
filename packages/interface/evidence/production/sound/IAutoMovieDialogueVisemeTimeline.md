# src/production/sound/IAutoMovieDialogueVisemeTimeline.ts#IAutoMovieDialogueVisemeTimeline

## @evidence contracts/development/common.md#meaningful-documentation

States what the ranges cover and how the sampler treats the time outside them.

## @evidence contracts/development/design.md#principled-representation

A line's placed visemes for one actor, from the first phoneme's start to the last's end, with pauses as `sil`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by the join, read by the samplers and the lip-sync measurement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Silence outside the line is implied by the sampler rather than stored as unbounded ranges.
