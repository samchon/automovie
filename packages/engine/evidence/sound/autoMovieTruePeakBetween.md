# src/sound/autoMovieTruePeakBetween.ts#autoMovieTruePeakBetween

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the window it reads, where the interpolants lie, the meaning of `start` and `stride`, and that the caller supplies zeros outside the signal.

## @evidence contracts/development/implementation.md#principled-implementation

Each interpolant is the convolution of the 24-sample window with one phase of the BS.1770-5 Annex 2 4× interpolator in `AUTOMOVIE_TRUE_PEAK_PHASES`; the largest absolute value is the window's true-peak contribution between its two middle samples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The meter (a ring of one channel, stride 1) and the limiter (interleaved stereo, stride 2) share this one window rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant of its own; the phases come from their owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

72 multiply-adds in one pass over the window, with the three phases sharing each read, because every sample of a film passes through it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its window.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It allocates nothing and holds no resource.
