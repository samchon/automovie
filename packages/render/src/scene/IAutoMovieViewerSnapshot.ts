/** Captured viewer frame. */
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
