# src/material/autoMovieProceduralFractal.ts#autoMovieProceduralFractal

## @evidence contracts/development/common.md#meaningful-documentation

States the octave count, lacunarity, gain, salts, normalization and its readers.

## @evidence contracts/development/implementation.md#principled-implementation

Fractional Brownian sum of four octaves with lacunarity 2 and gain 0.5, the values the issue fixes; dividing by the weight total keeps each octave's [-1, 1] bound for the sum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the sum that plaster, clay, stone, brushed metal, wood displacement and #4083's wear share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Constants are the issue's; per-octave salts only decorrelate lattices.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four noise evaluations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
