# src/sound/productionScoreDuckingEnvelope.ts#productionScoreDuckingEnvelope

## @evidence contracts/development/common.md#meaningful-documentation

Attack precedes each adopted line, release follows its exclusive end, and overlapping curves select the lowest gain. The caller supplies the production frame-to-sample boundary map.

## @evidence contracts/development/implementation.md#principled-implementation

Round absolute line boundaries and signed ramp anchors on the rational film clock, then clip the processed sample range while retaining both original ramp lengths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The caller provides the master sample count and adopted mono PCM map already admitted by the sound renderer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Caption text and absent dialogue assets never trigger the curve; there is no waveform analysis and no gain greater than one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Allocates one float per master sample only for an active curve; work is linear in its length plus the sum of adopted ramp and line sample spans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One curve serves all music cues, and unplaced adopted PCM has no effect.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one local sample buffer with no cache or resource handles.
