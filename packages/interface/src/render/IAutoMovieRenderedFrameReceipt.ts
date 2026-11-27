/**
 * Written beauty-frame receipt emitted by renderDrawnVideo after the
 * PNG write resolves. index and seconds preserve output order and subject time,
 * file is the host destination, and hash is the SHA-256 raster identity
 * including dimensions. This is distinct from IAutoMovieCapturedFrame's
 * timeSeconds/path receipt and does not inherit its spelling.
 */
export interface IAutoMovieRenderedFrameReceipt {
  /** Zero-based output frame ordinal, in capture and encoding order. */
  index: number;
  /** Subject-local sample second, index divided by the subject frame rate. */
  seconds: number;
  /** Host path of the PNG whose write completed before this receipt was added. */
  file: string;
  /**
   * HashAutoMovieRasterImage digest of decoded raster dimensions and RGBA
   * pixels, not encoded PNG bytes.
   */
  hash: string;
}
