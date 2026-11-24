# src/sound/resolveProductionLoudness.ts#resolveProductionLoudness

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the fallback to EBU R 128, how the dialogue target and the ceiling follow, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The dialogue target defaults to the integrated target, as #4053 defines it; the ceiling is the maximum true peak less the limiter's named margin, because the delivered check reads lossy-encoded audio.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function resolves the targets for the mix and carries them, with their source, into the loudness record the master stage and the report read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Values come from the production's intent, `AUTOMOVIE_EBU_R128_LOUDNESS` or `AUTOMOVIE_TRUE_PEAK_LIMITER`; nothing else is assumed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the intent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns a fresh record and holds no resource.
