import { IAutoMovieDeliveryCrop } from "./IAutoMovieDeliveryCrop";

/**
 * The output clock and pixel geometry shared by a render and every sidecar
 * sampled beside it. Keeping these values in one object lets callers reuse the
 * exact format for beauty/guide frames, captions, and pose keypoints instead of
 * restating three scalars that can silently diverge across tool calls.
 *
 * @evidence contracts/common.md#principled-implementation `frameTimes` yields `round(duration × fps)` samples at exact `i / fps`, and `ffmpegArgs` pins `-framerate`, `-r` and `-s width×height` from these fields, so the encoded size never follows the capture viewport.
 * @evidence contracts/common.md#clear-and-simple-design One object shared by render, caption and pose-keypoint planning replaces three loose scalars per call; `crop` is optional because delivering the whole gate is the common case.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The even-dimension rule is documented but no library validator enforces it for this type; only the playground render scripts refuse an odd size, so `planSequenceRender` and `ffmpegArgs` accept one.
 * @evidence contracts/common.md#meaningful-documentation States the fps sampling rule, pixel units, the `yuv420p` reason for even axes, that the rule is unenforced by the render package, and that an omitted crop equals the identity window.
 * @author Samchon
 */
export interface IAutoMovieRenderFrameFormat {
  /** Output frame rate; sets the frame count and sample times `t = i / fps`. */
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
