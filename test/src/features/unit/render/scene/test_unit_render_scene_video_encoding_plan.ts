import type { IAutoMovieRenderSpec } from "@automovie/interface";
import { planAutoMovieVideoEncoding } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * The delivery spec the production's render used: 1280 by 720 at 24 fps, H.264
 * in yuv420p at CRF 18.
 */
const SPEC: IAutoMovieRenderSpec = {
  target: "production",
  frameFormat: { width: 1280, height: 720, fps: 24 },
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 18,
};

/**
 * A drawn video's encoding is admitted on its exact clock and planned as the
 * one FFmpeg vector the production's render host ran, with and without a
 * soundtrack.
 *
 * Scenarios:
 *
 * 1. Two seconds at 24 fps give 48 frames and the scaffold host's silent vector:
 *    quiet logging, the frame sequence at 24 fps, libx264 in yuv420p at CRF 18
 *    with no B-frames, scaled to 1280x720 through the BT.709 matrix at full
 *    range and tagged BT.709, sRGB transfer and full range, fast start, movie
 *    and video track timescales of 24, four threads, the medium preset, 48
 *    frames, the video stream mapped, no audio, cut at 2 s.
 * 2. With a soundtrack, it is the second input, mapped as the first audio stream,
 *    padded and encoded as 48 kHz stereo AAC at 192 kb/s, and the output is
 *    still cut at 2 s.
 * 3. A clock of 2.01 s, 48.24 frames, is refused; so are zero seconds and more
 *    than a million frames.
 * 4. An odd raster, 1281 wide, is refused, and so is a blank soundtrack path.
 * 5. NTSC and decimal 29.97 fps keep different exact clocks in both FFmpeg rate
 *    arguments, and both timescales are the exact rate's numerator.
 */
export function test_unit_render_scene_video_encoding_plan(): void {
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
    "-bf",
    "0",
    "-vf",
    "scale=w=1280:h=720:out_color_matrix=bt709:out_range=full",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "iec61966-2-1",
    "-colorspace",
    "bt709",
    "-color_range",
    "pc",
    "-r",
    "24",
    "-movflags",
    "+faststart",
    "-movie_timescale",
    "24",
    "-video_track_timescale",
    "24",
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
    planAutoMovieVideoEncoding({
      spec: SPEC,
      durationSeconds: 2,
      frameDir: "frames",
      outputPath: "out/film.mp4",
      audio: null,
    }),
    {
      frameCount: 48,
      frameRate: [24, 1],
      args: [...base, ...video, "-an", "-t", "2", "out/film.mp4"],
    },
  );

  // 2. A soundtrack.
  TestValidator.equals(
    "the soundtrack vector",
    planAutoMovieVideoEncoding({
      spec: SPEC,
      durationSeconds: 2,
      frameDir: "frames",
      outputPath: "out/film.mp4",
      audio: "mix.wav",
    }).args,
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
        (): unknown =>
          planAutoMovieVideoEncoding({
            spec: SPEC,
            durationSeconds: seconds,
            frameDir: "f",
            outputPath: "o.mp4",
            audio: null,
          }),
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
      (): unknown =>
        planAutoMovieVideoEncoding({
          spec: SPEC,
          durationSeconds: 2,
          frameDir: "f",
          outputPath: "o.mp4",
          audio: " ",
        }),
      "blank",
    ),
  );

  // 5. Fractional frame rates.
  for (const { fps, rate, argument } of [
    { fps: 30000 / 1001, rate: [30000, 1001], argument: "30000/1001" },
    { fps: 29.97, rate: [2997, 100], argument: "2997/100" },
  ] as const) {
    const plan = planAutoMovieVideoEncoding({
      spec: { ...SPEC, frameFormat: { ...SPEC.frameFormat, fps } },
      durationSeconds: 1 / fps,
      frameDir: "f",
      outputPath: "o.mp4",
      audio: null,
    });
    TestValidator.equals("exact rate for " + argument, plan.frameRate, rate);
    TestValidator.equals(
      "encoder and audit share " + argument,
      [
        plan.args[plan.args.indexOf("-framerate") + 1],
        plan.args[plan.args.indexOf("-r") + 1],
        plan.args[plan.args.indexOf("-movie_timescale") + 1],
        plan.args[plan.args.indexOf("-video_track_timescale") + 1],
      ],
      [argument, argument, String(rate[0]), String(rate[0])],
    );
  }
}
