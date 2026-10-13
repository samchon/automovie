import { IAutoMovieDeliveryCrop } from "./IAutoMovieDeliveryCrop";

/**
 * The output clock and pixel geometry shared by a render and every sidecar
 * sampled beside it.
 *
 * Keeping the three values in one object lets a caller take the beauty and
 * guide frames, the caption plan's `fps`, and the pose-keypoint plan's `fps`,
 * aspect and crop from one source instead of restating scalars that can
 * silently diverge across tool calls.
 *
 * @evidence contracts/common.md#principled-implementation `frameTimes` derives `round(duration * fps)` frames sampled at the exact rational `i / fps`, and `ffmpegArgs` passes `fps` as both input and output rate and pins the encoded size with `-s width x height`, so the clock and raster here are the ones the encoder writes.
 * @evidence contracts/common.md#clear-and-simple-design Clock, raster and optional crop sit in one value nested under `IAutoMovieRenderSpec.frameFormat`, separate from the encoder settings, because the sidecars need the former and never the latter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing rounds an odd dimension up behind the caller; the remaining gap is that the plain render path does not check evenness or integrality, which the `width` documentation states, while the production render job checks evenness of its own frame format.
 * @evidence contracts/common.md#meaningful-documentation States what the clock sets, the units and parity rule of each dimension and why, who must enforce it, and that an omitted or whole-frame crop changes nothing.
 * @author Samchon
 */
export interface IAutoMovieRenderFrameFormat {
  /**
   * Finite positive output frame rate; sets the frame count
   * `round(duration * fps)` and the sample times `t = i / fps`.
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
