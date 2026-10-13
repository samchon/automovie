import { IAutoMovieRenderFrameFormat } from "./IAutoMovieRenderFrameFormat";

/**
 * Render parameters for turning a shot or sequence into frames and video. Kept
 * separate from the shot so the same shot renders at a draft 12 fps or a final
 * 30 or 60 fps without editing the content.
 *
 * The pipeline: `N = round(duration * frameFormat.fps)` frames, sampled at `t =
 * i / frameFormat.fps` (rational, not accumulated, for determinism), each
 * rendered headless to an sRGB image, then encoded by `ffmpeg -framerate fps
 * -c:v libx264 -pix_fmt yuv420p -crf crf -r fps -s widthxheight -movflags
 * +faststart`. The encoder never tone maps; the curve is a renderer setting
 * applied before capture.
 *
 * @evidence contracts/common.md#principled-implementation `frameTimes` computes each sample as `i / fps` rather than by accumulation so no rounding drift builds up, `ffmpegArgs` passes the codec, pixel format, CRF, rate and size verbatim, and `autoMovieRenderTargetSettingsOfShot` resolves the curve as the scene environment's `toneMapping` when present, else this spec's.
 * @evidence contracts/common.md#clear-and-simple-design The spec holds only delivery choices (target, clock and raster, curve default, encoder settings) and never content, and `codec` and `pixelFormat` are single-member unions because one encoder path exists and a wider option would promise output nothing produces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural passes bypass tone mapping as a rule rather than per scene, and the curve is never forced onto a scene that declares its own; the remaining gap is that `crf` reaches the encoder unchecked, which its documentation states.
 * @evidence contracts/common.md#meaningful-documentation States the frame count and sample formula, the exact encoder arguments, which layer owns the tone curve and when this default applies, that structural passes ignore it, and that the caller must keep the CRF in range.
 * @author Samchon
 */
export interface IAutoMovieRenderSpec {
  /** Id of the shot or sequence to render. */
  target: string;

  /**
   * Shared output clock and pixel geometry. Take the caption and pose-keypoint
   * plans' `fps`, aspect and crop from this same object so every companion is
   * sampled against the render it describes.
   */
  frameFormat: IAutoMovieRenderFrameFormat;

  /**
   * Tone mapping applied before the sRGB encode: `none` for the stylized toon
   * path, `acesFilmic` for the photoreal path.
   *
   * This is the delivery default, and a scene overrides it. A scene's optional
   * `environment` owns the photographic response of that scene (its image
   * lighting, exposure and curve), and one render spec covers a whole sequence
   * of scenes, so a spec-level curve forced onto every shot would flatten a
   * night interior and a noon exterior into one response. A scene that
   * declares no environment keeps this value.
   *
   * Structural passes (depth, normal, mask, outline) ignore both. Their pixels
   * are geometric facts, so tone mapping and exposure are bypassed there.
   */
  toneMapping: "none" | "acesFilmic";

  /** Video codec; `h264` through libx264 is the only encoder path. */
  codec: "h264";

  /**
   * Pixel format; `yuv420p` for broad player compatibility and deterministic
   * output.
   */
  pixelFormat: "yuv420p";

  /**
   * Quality factor (libx264 CRF; about 17 is visually lossless, 0 lossless).
   * Passed to ffmpeg unchecked, so the caller keeps it within the encoder's
   * range.
   */
  crf: number;
}
