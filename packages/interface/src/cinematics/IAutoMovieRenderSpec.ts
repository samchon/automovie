import type { IAutoMovieRenderFrameFormat } from "./IAutoMovieRenderFrameFormat";

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
   * night interior and a noon exterior into one response. A scene that declares
   * no environment keeps this value.
   *
   * Structural passes (depth, normal, mask, outline) ignore both. Their pixels
   * are geometric facts, so tone mapping and exposure are bypassed there.
   */
  toneMapping: "none" | "acesFilmic";

  /** Video codec; `h264` through libx264 is the only encoder path. */
  codec: "h264";

  /** Pixel format passed to the encoder; the supported path uses `yuv420p`. */
  pixelFormat: "yuv420p";

  /**
   * Libx264 CRF quality factor, passed to ffmpeg unchecked. The caller supplies
   * a supported encoder value; this field alone does not certify perceptual
   * quality or repeatable encoded bytes across encoder versions.
   */
  crf: number;
}
