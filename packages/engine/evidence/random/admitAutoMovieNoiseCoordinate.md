# src/random/admitAutoMovieNoiseCoordinate.ts#admitAutoMovieNoiseCoordinate

## @evidence contracts/development/common.md#meaningful-documentation

States why the noise has a bounded domain (the stream's 2^53 indices), what each parameter means and in which units, and both refusals with the parameter name they carry.

## @evidence contracts/development/implementation.md#principled-implementation

Refuses a non-finite value, then compares the finest-octave lattice coordinate `value * scale` with the caller's bound. The negated `<=` comparison also refuses a NaN product, which arises when an unbounded octave count makes `scale` infinite and `value` is zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission shared by the single-octave and fractal noise in both dimensions, so every refusal names its coordinate and bound in the same words.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound comes from the caller, which derives it from the stream's index capacity; nothing is clamped or defaulted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two comparisons and one multiplication per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check with nothing to share between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds no state, handle or allocation beyond the thrown error.
