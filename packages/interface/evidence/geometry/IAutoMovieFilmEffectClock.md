# src/geometry/IAutoMovieFilmEffectClock.ts#IAutoMovieFilmEffectClock

## @evidence contracts/development/design.md#principled-representation

A `Pick` of the compiled timeline, so the two projections read the very fields the builder wrote; the rate pair is resolved through `resolveProductionFrameRate`, which reduces the rational by its greatest common divisor and refuses a display `fps` that differs from it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Narrows the timeline to the rate and segment list a frame projection needs, so a caller holding only a clock can ask a shot-time or interval question without inventing tracks, omissions or fingerprints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default rate is assumed: an absent `frameRate` is read as `fps/1` only when `fps` is a positive safe integer, and a fractional `fps` without its rational is refused rather than rounded.

## @evidence contracts/development/common.md#meaningful-documentation

States who owns the clock, what segments and the rate are used for, the consistency required between `fps` and `frameRate`, the integer `fps/1` reading, and that an inconsistent pair is refused.
