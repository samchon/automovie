

/**
 * Written beauty-frame receipt emitted by renderAutoMovieDrawnVideo after the PNG write resolves. index and seconds preserve output order and subject time, file is the host destination, and hash is the SHA-256 raster identity including dimensions. This is distinct from IAutoMovieCapturedFrame's timeSeconds/path receipt and does not inherit its spelling.
 *
 * @evidence contracts/development/design.md#principled-representation Written beauty-frame receipt emitted by renderAutoMovieDrawnVideo after the PNG write resolves. index and seconds preserve output order and subject time, file is the host destination, and hash is the SHA-256 raster identity including dimensions. This is distinct from IAutoMovieCapturedFrame's timeSeconds/path receipt and does not inherit its spelling.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named operation and its callers share this exact record instead of deriving a type from implementation code.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The documented boundary preserves its producer's admitted values and does not introduce a fallback representation.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the concrete producer, interpretation and failure or comparison semantics.
 */
export interface IAutoMovieRenderedFrameReceipt {
  /** Zero-based output frame ordinal, in capture and encoding order. */
  index: number;
  /** Subject-local sample second, index divided by the subject frame rate. */
  seconds: number;
  /** Host path of the PNG whose write completed before this receipt was added. */
  file: string;
  /** hashAutoMovieRasterImage digest of decoded raster dimensions and RGBA pixels, not encoded PNG bytes. */
  hash: string;
}
