import type { IAutoMovieRenderSpec } from "@automovie/interface";
import { planAutoMovieVideoEncoding } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/** The delivery spec the production's render used: 1280 by 720 at 24 fps, H.264 in yuv420p at CRF 18. */
const SPEC: IAutoMovieRenderSpec = {
  target: "production",
  frameFormat: { width: 1280, height: 720, fps: 24 },
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 18,
};

/**
 * A drawn video's encoding is admitted on its exact clock and planned as the one FFmpeg vector the production's render host ran, with and without a soundtrack.
 *
 * Scenarios:
 *
 * 1. Two seconds at 24 fps give 48 frames and the scaffold host's silent vector: quiet logging, the frame sequence at 24 fps, libx264 in yuv420p at CRF 18 and 1280x720 with fast start, four threads, the medium preset, 48 frames, the video stream mapped, no audio, cut at 2 s.
 * 2. With a soundtrack, it is the second input, mapped as the first audio stream, padded and encoded as 48 kHz stereo AAC at 192 kb/s, and the output is still cut at 2 s.
 * 3. A clock of 2.01 s, 48.24 frames, is refused; so are zero seconds and more than a million frames.
 * 4. An odd raster, 1281 wide, is refused, and so is a blank soundtrack path.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans encodings through the exported planner and compares the whole vector; a planner that dropped the frame cap, the stream map, the clock cut or the soundtrack's padding, or admitted a fractional clock, fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected vectors are written out argument by argument from the arguments the scaffold's delivery host passed to FFmpeg before #3314 moved it, which is the case matrix's requirement that `automovie render` plan the same encoder arguments; frame counts are seconds times fps.
 * @evidence contracts/development/testing.md#distinguishing-cases Silent against soundtrack, a whole clock against a fractional, empty and oversized one, an even raster against an odd one, and a blank soundtrack. Drawing and writing the frames is owned by `test_draw_drawn_video`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_render_video_encoding_plan`; it runs no FFmpeg.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_render_video_encoding_plan(): void {
  const base: string[] = [
    "-v",
    "warning",
    "-y",
    "-framerate",
    "24",
    "-i",
    "frames/frame_%05d.png",
  ];
  const video: string[] = [
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-r",
    "24",
    "-s",
    "1280x720",
    "-movflags",
    "+faststart",
    "-threads",
    "4",
    "-preset",
    "medium",
    "-frames:v",
    "48",
    "-map",
    "0:v:0",
  ];

  // 1. Silent.
  TestValidator.equals(
    "the silent vector",
    planAutoMovieVideoEncoding({ spec: SPEC, durationSeconds: 2, frameDir: "frames", outputPath: "out/film.mp4", audio: null }),
    { frameCount: 48, args: [...base, ...video, "-an", "-t", "2", "out/film.mp4"] },
  );

  // 2. A soundtrack.
  TestValidator.equals(
    "the soundtrack vector",
    planAutoMovieVideoEncoding({ spec: SPEC, durationSeconds: 2, frameDir: "frames", outputPath: "out/film.mp4", audio: "mix.wav" }).args,
    [
      ...base,
      "-i",
      "mix.wav",
      ...video,
      "-map",
      "1:a:0",
      "-af",
      "apad",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-t",
      "2",
      "out/film.mp4",
    ],
  );

  // 3. Clocks.
  for (const seconds of [2.01, 0, 50_000])
    TestValidator.predicate(
      `a clock of ${seconds} s is refused`,
      throwsError(
        (): unknown => planAutoMovieVideoEncoding({ spec: SPEC, durationSeconds: seconds, frameDir: "f", outputPath: "o.mp4", audio: null }),
        "whole number of frames",
      ),
    );

  // 4. Raster and soundtrack.
  TestValidator.predicate(
    "an odd raster",
    throwsError(
      (): unknown =>
        planAutoMovieVideoEncoding({
          spec: { ...SPEC, frameFormat: { ...SPEC.frameFormat, width: 1281 } },
          durationSeconds: 2,
          frameDir: "f",
          outputPath: "o.mp4",
          audio: null,
        }),
      "1281x720",
    ),
  );
  TestValidator.predicate(
    "a blank soundtrack",
    throwsError(
      (): unknown => planAutoMovieVideoEncoding({ spec: SPEC, durationSeconds: 2, frameDir: "f", outputPath: "o.mp4", audio: " " }),
      "blank",
    ),
  );
}
