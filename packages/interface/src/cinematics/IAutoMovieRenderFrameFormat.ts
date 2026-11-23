import type { IAutoMovieDeliveryCrop } from "./IAutoMovieDeliveryCrop";

/**
 * The output clock and pixel geometry shared by a render and every sidecar
 * sampled beside it.
 *
 * Keeping the three values in one object lets a caller take the beauty and
 * guide frames, the caption plan's `fps`, and the pose-keypoint plan's `fps`,
 * aspect and crop from one source instead of restating scalars that can
 * silently diverge across tool calls.
 */
export interface IAutoMovieRenderFrameFormat {
  /**
   * Finite positive output frame rate; sets the frame count `round(duration *
   * fps)` and the sample times `t = i / fps`.
   */
  fps: number;

  /**
   * Output width in pixels. Must be a positive even whole number: `yuv420p`
   * chroma subsampling can only encode even axes, and the pose-keypoint sidecar
   * projects through the resulting `width / height` camera aspect. The render
   * package does not check this; the caller must.
   */
  width: number;

  /** Output height in pixels; subject to the same rule as {@link width}. */
  height: number;

  /**
   * Optional window of the uncropped gate projected onto this full raster.
   * Omission and `{ left: 0, top: 0, right: 1, bottom: 1 }` are geometric
   * no-ops.
   */
  crop?: IAutoMovieDeliveryCrop;
}
