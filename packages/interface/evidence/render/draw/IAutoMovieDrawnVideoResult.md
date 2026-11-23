# src/render/draw/IAutoMovieDrawnVideoResult.ts#IAutoMovieDrawnVideoResult

## @evidence contracts/development/design.md#principled-representation

Failed drawing/writing/encoding rejects without returning partial success; prior files remain host-owned.

## @evidence contracts/development/design.md#minimal-and-owned-surface

renderAutoMovieDrawnVideo returns one receipt per written frame, the encoder arguments and any audit of the drawn samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Failed drawing/writing/encoding rejects without returning partial success; prior files remain host-owned.

## @evidence contracts/development/common.md#meaningful-documentation

Successful sequential beauty capture and encoding receipts. renderAutoMovieDrawnVideo returns after the host encoder resolves, with one receipt per written frame and the actual encoder arguments. The prose and members document how renderAutoMovieDrawnVideo interprets and admits these values.
