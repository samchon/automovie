# src/cinematics/IAutoMovieTransition.ts#IAutoMovieTransition

## @evidence contracts/development/design.md#principled-representation `playbackCursor` and `resolveFromTimeline` sample the previous entry's tail beside the live entry with incoming weight `elapsed / duration`, a linear dissolve over the overlap `sequenceTimeline` created by pulling the entry forward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A style tag and a length are all the edit needs; the overlap placement and blend weight are derived by the timeline instead of being stored per entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The documentation states that `fade` samples like a dissolve instead of implying a fade-through-black the sampler does not perform, and an over-long transition is refused rather than shortened.

## @evidence contracts/development/common.md#meaningful-documentation

States the overlap semantics, every refusal, the blend weight, and that the kind is not yet distinguished by frame sampling.
