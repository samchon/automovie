# src/render/IAutoMovieSequenceRenderShotSpan.ts#IAutoMovieSequenceRenderShotSpan

## @evidence contracts/development/design.md#principled-representation

An entry index joins a committed shot to its global start and end, output duration, source offset and effective nondefault rate, preserving the authored trim.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The manifest exposes shot timing in one span record so capture hosts need not recompute sequence trim arithmetic.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The span records engine-resolved timing and authored trim without supplying a replacement shot or consumer-specific duration.

## @evidence contracts/development/common.md#meaningful-documentation

Member documentation distinguishes global seconds, source-local seconds, entry indexing, nullable authored trim and the default playback rate.
