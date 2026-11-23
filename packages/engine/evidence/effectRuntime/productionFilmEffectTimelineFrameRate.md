# src/effectRuntime/productionFilmEffectTimelineFrameRate.ts#productionFilmEffectTimelineFrameRate

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `resolveProductionFrameRate`, which reduces the rational and requires `fps` to equal `numerator / denominator` as the same float division every consumer performs, so one timeline cannot carry two clocks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Translates the shared resolver's plain `Error` into the film-effect refusal class, so the shot-time mapper, the interval projector and the population verifier refuse an ambiguous clock under one code without each repeating the try block.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The catch never falls back to `fps` or to the declared rational when the two disagree; every resolver failure becomes the one refusal.

## @evidence contracts/development/common.md#meaningful-documentation

States the two ways the rate is read, each refused case, the refusal code, and why ambiguity is refused before any projection.

## @evidence contracts/development/implementation.md#efficient-algorithms

One greatest-common-divisor reduction, logarithmic in the smaller term, plus one division and comparison.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure resolution per call; each consumer resolves once at its start and reuses the value for all of its frames.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new two-number record and keeps no reference to the timeline.
