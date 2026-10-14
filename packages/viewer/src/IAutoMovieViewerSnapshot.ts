/**
 * Captured viewer frame.
 *
 * @evidence contracts/common.md#principled-implementation Carries post-draw canvas dimensions, requested MIME and the original synchronous encoder returned data URL.
 * @evidence contracts/common.md#clear-and-simple-design A small owned readout remains distinct from renderer/source/hardware receipts and delivery validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested MIME is not verified payload encoding, and a returned string/extent alone cannot certify nonblank current-source pixels or native rendering.
 * @evidence contracts/common.md#meaningful-documentation Documents physical pixel dimensions, requested format and unverified original inline payload.
 * @evidence contracts/performance.md#efficient-algorithms Fixed metadata accompanies an encoded string proportional to image bytes; consumers must account for that payload rather than treating the record as constant-size storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A snapshot represents its own completed draw/readout and is not reused by equal dimensions or request MIME alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only copied scalar fields/string escape, no native disposer is carried and consumer references determine encoded-image retention.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSnapshot {
  /** Canvas pixel width. */
  width: number;

  /** Canvas pixel height. */
  height: number;

  /** MIME type requested for the snapshot. */
  mimeType: string;

  /** Inline image payload returned by the renderer canvas. */
  dataUrl: string;
}
