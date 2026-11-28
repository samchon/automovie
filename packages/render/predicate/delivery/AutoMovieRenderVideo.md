# src/delivery/AutoMovieRenderVideo.ts#AutoMovieRenderVideo.renderDrawnVideo

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the subject clock, host file writes, encoding order and incomplete scene audit. The host owns the lifetime of the written frames.

## @evidence contracts/development/implementation.md#principled-implementation

The encoder plan admits a whole-frame clock first. Frames use the subject's indexed native grid. The composer writes all requested pass files before delivering a frame receipt. On failure it reduces gathered scene packets against the full expected schedule so uncovered frames remain unresolved.

## @evidence contracts/development/implementation.md#efficient-algorithms

The schedule is traversed once in order. Each pass is drawn once per frame and each frame reaches one encode call after the sequence completes. Observation retains no separate history in the composer. Scene packets are reduced once on success or interrupted drawing.
