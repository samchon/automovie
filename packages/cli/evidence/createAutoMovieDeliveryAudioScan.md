# src/createAutoMovieDeliveryAudioScan.ts#createAutoMovieDeliveryAudioScan

## @evidence contracts/development/common.md#meaningful-documentation

Gives the sample format, per-channel rule, presented range, exact interval boundary behavior and the optional loudness meter fed with presented samples only.

## @evidence contracts/development/implementation.md#principled-implementation

Counts one sample frame per complete group of channels and checks any silence duration against the rational threshold rounded upward to the next sample. Presented samples feed the render's BS.1770-5 meter, which measures 48 kHz mono or stereo, so codec padding never reaches the loudness reading and an unsupported format is left unmeasured rather than misread.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses one small carry buffer for split floats, a single open silence interval across chunks, and a batch of whole frames for the meter, which the caller supplies because the CLI reaches engine only through the production's render.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite samples and partial floats or channel frames make evidence invalid, including in padding.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each float once, retaining a single partial float and only threshold-qualifying intervals; the meter receives batches of 4096 frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each decoded audio stream is scanned once by its own scanner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The scanner keeps a four-byte carry, a 4096-frame batch, the meter, its counters and the silent intervals that qualify, acquires no handle, and is released with the caller's reference.
