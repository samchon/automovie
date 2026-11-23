# src/draw/renderAutoMovieDrawnVideo.ts#renderAutoMovieDrawnVideo

## @evidence contracts/development/common.md#meaningful-documentation

States where the clock and raster come from, when the plan is admitted, how a sound list becomes the soundtrack, how a subject's cut is mapped onto the drawn frames, how each frame is drawn with its control passes in one call, named and written, how control frames are written and digested, what the host supplies and what a failure leaves.

## @evidence contracts/development/implementation.md#principled-implementation

Every delivered frame comes from the same draw function inspection stills use, at the exact schedule `frameTimes` gives, and the encoder runs on the vector `planAutoMovieVideoEncoding` admits, so a delivered video and a still at the same second are drawn by the same code.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan, mix and write a sound list's soundtrack through `mixAutoMovieFilmSound` before any frame, then the cut mapped by `planAutoMovieDeliveredCut` over the same schedule, then one loop of draw, encode as PNG, hash and write, then an optional scene audit and one encode; a subject naming both a sound list and a soundtrack is refused before the mix.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame is skipped or reused and no failure is retried.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in frames times pixels: one draw, one PNG encoding and one hash per frame.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each frame is drawn once; nothing is shared between renders.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mixed soundtrack's bytes are released after they are written; one frame's picture and bytes are held at a time, plus frame receipts and any diagnostic packets until reduction; the session stays the caller's.
