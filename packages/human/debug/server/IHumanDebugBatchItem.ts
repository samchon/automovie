/** One frame of a batch render, as the batch route lists it. */
export interface IHumanDebugBatchItem {
  /** Piece entry drawn, or null for the whole figure. */
  piece: string | null;

  /** Camera name. */
  camera: string;

  /** Absolute path of the saved PNG, or null when the frame failed. */
  file: string | null;

  /** Source hash the frame reflects, or null when it failed. */
  source: string | null;

  /** SHA-256 of the saved PNG, or null when it failed. */
  pngSha256: string | null;

  /** The page's notices for the frame. */
  notices: string[];

  /** Failure message, or null. */
  error: string | null;
}
