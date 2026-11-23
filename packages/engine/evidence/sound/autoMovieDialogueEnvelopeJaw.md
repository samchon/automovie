# src/sound/autoMovieDialogueEnvelopeJaw.ts#autoMovieDialogueEnvelopeJaw

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the closed, full and intermediate openings, the unit of the input and the output, and that the jaw follows the line's loudness with no lag.

## @evidence contracts/development/implementation.md#principled-implementation

A line without phonemes has only its loudness to time the mouth by; opening linearly in dB between a floor and a full level maps the perceived level range onto the jaw's speech range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The levels come from `productionDialogueFrameLevels`; the settings from `AUTOMOVIE_DIALOGUE_ENVELOPE_JAW`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The floor, full level and opening are named defaults with stated origins; nothing is tuned to a test.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time per frame.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one level.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It allocates nothing and holds no resource.
