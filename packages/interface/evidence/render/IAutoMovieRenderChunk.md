# src/render/IAutoMovieRenderChunk.ts#IAutoMovieRenderChunk

## @evidence contracts/development/design.md#principled-representation

A chunk is a half-open range `[frameStart, frameEnd)` of global output indices with chunk-local file indices, so concatenating chunks in `index` order reproduces the whole schedule and every chunk's frame files start at `frame_00000`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The chunk repeats the whole plan's per-render fields (frame directory, first and last frame, input pattern, output path, ffmpeg arguments) so a host renders it with the same code path as an unchunked plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every sample field of a chunk frame is copied from the whole plan rather than recomputed, so a chunk cannot render differently from the same frames of the unchunked plan, and no chunk position is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The prose states what a chunk is for; members give the inclusive and exclusive bounds, the global and chunk-local frames of reference, and when the guide-pass field is present.
