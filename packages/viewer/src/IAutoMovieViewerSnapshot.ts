/**
 * Captured viewer frame.
 *
 * @evidence contracts/development/design.md#principled-representation Carries post-draw canvas dimensions, requested MIME and the original synchronous encoder returned data URL.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A small owned readout remains distinct from renderer/source/hardware receipts and delivery validation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Requested MIME is not verified payload encoding, and a returned string/extent alone cannot certify nonblank current-source pixels or native rendering.
 * @evidence contracts/development/common.md#meaningful-documentation Documents physical pixel dimensions, requested format and unverified original inline payload.
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
