import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliCapture } from "automovie";

/**
 * Probe the selected video stream and the estimated sampling rate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which stream is selected and how the sampling rate falls back.
 * @evidence contracts/development/testing.md#behavioral-verification Reads native FFmpeg text through the CLI parser and checks stream, raster and rate fields.
 * @evidence contracts/development/testing.md#independent-expectations Audio at index zero is followed by video at index two and another video at index three. The exact 24000/1001 filter rate takes precedence over the nominal 23.98 banner rate.
 */
export function test_cli_capture_video_probe(): void {
  const input: string =
    "  Duration: 00:00:00.33, start: 0.000000, bitrate: 53 kb/s\n" +
    "  Stream #0:0: Audio: aac, 44100 Hz\n" +
    "  Stream #0:2[0x3](und): Video: h264, yuv420p, 32x32, 23.98 fps, 23.98 tbr\n" +
    "  Stream #0:3: Video: h264, yuv420p, 64x64, 30 fps, 30 tbr\n";
  const showinfo: string =
    "[Parsed_showinfo_0 @ 0000] config in time_base: 1/24000, frame_rate: ";
  TestValidator.equals(
    "the rational filter rate preserves the exact grid",
    AutoMovieCliCapture.readVideoProbe(input + showinfo + "24000/1001"),
    { streamIndex: 2, durationSeconds: 0.33, fps: 24000 / 1001, width: 32, height: 32 },
  );
  TestValidator.equals(
    "an input-only log keeps its printed fps",
    AutoMovieCliCapture.readVideoProbe(input).fps,
    23.98,
  );
  TestValidator.equals(
    "an unavailable filter rate keeps the printed fps",
    AutoMovieCliCapture.readVideoProbe(input + showinfo + "0/0").fps,
    23.98,
  );
  TestValidator.equals(
    "a legacy stream without fps uses tbr",
    AutoMovieCliCapture.readVideoProbe(input.replace("23.98 fps, ", "")).fps,
    23.98,
  );
}
