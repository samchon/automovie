/** Renderer identity: what the frame is drawn by. */
export interface IAutoMovieRenderTargetRenderer {
  /** Graphics API family, such as `webgl2`. */
  api: string;

  /** Reported hardware vendor, or `unknown` when the host withholds it. */
  vendor: string;

  /** Reported device or renderer string, or `unknown`. */
  device: string;
}
