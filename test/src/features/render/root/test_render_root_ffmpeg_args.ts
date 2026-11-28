import type { IAutoMovieRenderSpec } from "@automovie/interface";
import { AutoMovieRenderVideo } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `ffmpegArgs` encodes a render spec as the pinned ffmpeg command: H.264 at the
 * spec's pixel format and crf, no B-frames, a BT.709 full-range scale to the
 * frame size, sRGB colour tags and faststart.
 *
 * Scenarios:
 *
 * 1. A 1920×1080, 30 fps, crf 20 yuv420p spec gives the pinned vector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Pins the encoder argument vector for one 1920 × 1080, 30 fps H.264 render specification.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the argument planner directly with a fixed raster, pixel format, CRF and input and output paths.
 * @evidence contracts/development/testing.md#independent-expectations Compares the complete literal vector, including the input rate, scaling, retained color tags, disabled B-frames and fast-start flag.
 */
export function test_render_root_ffmpeg_args(): void {
  const spec: IAutoMovieRenderSpec = {
    target: "shot-1",
    frameFormat: { fps: 30, width: 1920, height: 1080 },
    toneMapping: "none",
    codec: "h264",
    pixelFormat: "yuv420p",
    crf: 20,
  };
  TestValidator.equals(
    "the command",
    AutoMovieRenderVideo.ffmpegArgs(spec, "in/frame_%05d.png", "out.mp4"),
    [
      "-y",
      "-framerate",
      "30",
      "-i",
      "in/frame_%05d.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "20",
      "-bf",
      "0",
      "-vf",
      "scale=w=1920:h=1080:out_color_matrix=bt709:out_range=full",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "iec61966-2-1",
      "-colorspace",
      "bt709",
      "-color_range",
      "pc",
      "-r",
      "30",
      "-movflags",
      "+faststart",
      "out.mp4",
    ],
  );
}
