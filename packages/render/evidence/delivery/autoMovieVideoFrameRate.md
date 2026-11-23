# src/delivery/autoMovieVideoFrameRate.ts#autoMovieVideoFrameRate

## @evidence contracts/development/common.md#meaningful-documentation

States what the rate is for, how FFmpeg derives it from a numeric rate, the fallback and the two refusals.

## @evidence contracts/development/implementation.md#principled-implementation

FFmpeg's own parse: the binary64 rate scaled to a power-of-two denominator, then the nearest bounded continued fraction under its video-rate term limit, falling back to its AVRational limit, so the encoder, the audit and the sound placed on the film clock share the rational FFmpeg presents.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Its own module, so the encoding plan and a capture that places a film's dialogue on the same clock call one rule instead of copying it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rate with no positive representation is refused rather than rounded.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two continued-fraction expansions, each logarithmic in the scaled terms.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one number.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns two numbers and keeps nothing.
