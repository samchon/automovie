import { TestValidator } from "@nestia/e2e";
import { readAutoMovieVideoProbe } from "automovie";

export function test_cli_capture_video_probe(): void {
  const input: string =
    "  Duration: 00:00:00.33, start: 0.000000, bitrate: 53 kb/s\n" +
    "  Stream #0:0: Video: h264, yuv420p, 32x32, 23.98 fps, 23.98 tbr\n";
  const showinfo: string =
    "[Parsed_showinfo_0 @ 0000] config in time_base: 1/24000, frame_rate: ";
  TestValidator.equals(
    "the rational filter rate preserves the exact grid",
    readAutoMovieVideoProbe(input + showinfo + "24000/1001"),
    { durationSeconds: 0.33, fps: 24000 / 1001, width: 32, height: 32 },
  );
  TestValidator.equals(
    "an input-only log keeps its printed fps",
    readAutoMovieVideoProbe(input).fps,
    23.98,
  );
  TestValidator.equals(
    "an unavailable filter rate keeps the printed fps",
    readAutoMovieVideoProbe(input + showinfo + "0/0").fps,
    23.98,
  );
  TestValidator.equals(
    "a legacy stream without fps uses tbr",
    readAutoMovieVideoProbe(input.replace("23.98 fps, ", "")).fps,
    23.98,
  );
}
