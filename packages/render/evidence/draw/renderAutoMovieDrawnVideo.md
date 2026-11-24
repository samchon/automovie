# src/draw/renderAutoMovieDrawnVideo.ts#renderAutoMovieDrawnVideo

## @evidence contracts/development/common.md#meaningful-documentation

States where the clock and raster come from, when the plan is admitted, how a sound list becomes the soundtrack, how the same lines become the dialogue mouths handed to the subject, also for a transparent layer, and how each line's lip sync is measured on the mouths the subject read, how a subject's cut is mapped onto the drawn frames, how each frame is drawn with its control passes in one call, named and written, how control frames are written and digested, how a transparent render writes RGBA frames and hands the encoder the alpha wrap with no soundtrack, what the host supplies and what a failure leaves.

## @evidence contracts/development/implementation.md#principled-implementation

Every delivered frame comes from the same draw function inspection stills use, at the exact schedule `frameTimes` gives, and the encoder runs on the vector `planAutoMovieVideoEncoding` admits, so a delivered video and a still at the same second are drawn by the same code. The mouths are planned from the lines the mix admitted, on the same exact rate, and the lip-sync series is what the subject read on each drawn frame, so the report measures the mouth handed to the drawing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan, mix and write a sound list's soundtrack through `mixAutoMovieFilmSound` before any frame, or admit the lines alone for a transparent layer, then plan and hand the mouths through the session; then the cut mapped by `planAutoMovieDeliveredCut` over the same schedule, then one loop of draw, encode as PNG, hash and write that also keeps each frame's drawn mouths, then the sound record with its lip sync, an optional scene audit and one encode; a subject naming both a sound list and a soundtrack is refused before the mix.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame is skipped or reused, no failure is retried, and no lip-sync series is recomputed from the track in place of what was drawn.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in frames times pixels: one draw, one PNG encoding and one hash per frame; the mouths add one short list per frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mix's admitted lines serve the mouth plan and the lip-sync measure, so a line is read and decoded once per render. Each frame is drawn once; nothing is shared between renders.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mixed soundtrack's bytes are released after they are written; one frame's picture and bytes are held at a time, plus frame receipts, each frame's drawn mouths and any diagnostic packets until the sound record and reduction; the admitted lines live until the measure; the session stays the caller's.
