# src/delivery/AutoMovieControlChannelWriter.ts#AutoMovieControlChannelWriter

## @evidence contracts/development/common.md#meaningful-documentation

States what it writes, under which names, which digest it keeps and why, the mask palette rule, and the call order.

## @evidence contracts/development/design.md#principled-representation

Holds the admitted passes, their folder, the host's writer and per-pass frame lists parallel to the passes, so a channel's frames stay in index order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owner and consumers: `renderAutoMovieDrawnVideo` creates one per render with control passes and calls `add` per frame and `finish` once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Files go through the host's `write`, so the writer launches nothing and runs under a unit test.

# src/delivery/AutoMovieControlChannelWriter.ts#AutoMovieControlChannelWriter.prototype.add

## @evidence contracts/development/common.md#meaningful-documentation

States the pictures expected and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

PNG-encodes each pass picture with the codec the film's frames use, writes it as `guidePassFrameName(index, pass)` and keeps the SHA-256 of the written bytes from `digestAutoMovieBytes`, the file digest a manifest records.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the passes; the mask palette check is its own method.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A picture of another pass, or a mask painted with another palette, is refused rather than recorded.

## @evidence contracts/development/implementation.md#efficient-algorithms

One PNG encoding and one digest per pass per frame, linear in pixels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One picture's bytes are held at a time; only frame records accumulate, one per pass per frame.

# src/delivery/AutoMovieControlChannelWriter.ts#AutoMovieControlChannelWriter.prototype.finish

## @evidence contracts/development/common.md#meaningful-documentation

States the order of channels and what each carries.

## @evidence contracts/development/implementation.md#principled-implementation

Builds each channel with its convention and the sequence digest: SHA-256 over the frame digests as 64-digit lines with line feeds, UTF-8 encoded, so a reader recomputes it from the record alone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over the passes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The convention comes from `autoMovieControlConvention`, not a restated value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
