# src/draw/index.ts#renderAutoMovieDrawnVideo

## @evidence contracts/development/common.md#meaningful-documentation

States where the clock and raster come from, when the plan is admitted, how each frame is drawn, named and written, what the host supplies and what a failure leaves.

## @evidence contracts/development/implementation.md#principled-implementation

Every delivered frame comes from the same draw function inspection stills use, at the exact schedule `frameTimes` gives, and the encoder runs on the vector `planAutoMovieVideoEncoding` admits, so a delivered video and a still at the same second are drawn by the same code.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan, then one loop of draw, encode as PNG, hash and write, then an optional scene audit and one encode.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame is skipped or reused and no failure is retried.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in frames times pixels: one draw, one PNG encoding and one hash per frame.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each frame is drawn once; nothing is shared between renders.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One frame's picture and bytes are held at a time, plus frame receipts and any diagnostic packets until reduction; the session stays the caller's.
