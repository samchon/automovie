# src/render/draw/IAutoMovieRenderedFrameReceipt.ts#IAutoMovieRenderedFrameReceipt

## @evidence contracts/development/design.md#principled-representation

Written beauty-frame receipt emitted by renderAutoMovieDrawnVideo after the PNG write resolves. index and seconds preserve output order and subject time, file is the host destination, and hash is the SHA-256 raster identity including dimensions. This is distinct from IAutoMovieCapturedFrame's timeSeconds/path receipt and does not inherit its spelling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named operation and its callers share this exact record instead of deriving a type from implementation code.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The documented boundary preserves its producer's admitted values and does not introduce a fallback representation.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the concrete producer, interpretation and failure or comparison semantics.
