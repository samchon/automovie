/** Options for reading one rendered viewer frame as an inline image. */
export interface IAutoMovieRenderViewerSnapshotOptions {
  /** Image MIME type. Defaults to `image/png`. */
  mimeType?: string;

  /** Encoder quality for formats that support it. */
  quality?: number;
}
