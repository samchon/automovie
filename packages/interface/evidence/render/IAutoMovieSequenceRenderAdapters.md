# src/render/IAutoMovieSequenceRenderAdapters.ts#IAutoMovieSequenceRenderAdapters

## @evidence contracts/development/design.md#principled-representation

Sequence capture receives the fully resolved frame and the same manifest used for encoding, including outgoing blend tails.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These callbacks separate host drawing and encoder effects from deterministic sequence playback resolution.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared callbacks are public host seams and do not replace renderer globals or hidden engine state.

## @evidence contracts/development/common.md#meaningful-documentation

Capture returns the actual written frame path and encode returns the actual video path, with all frame timing supplied by the plan.
