import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieViewerVideoOptions } from "../../../../packages/template/scaffold/production/src/executable/render/node/IAutoMovieViewerVideoOptions";
import { planViewerVideo } from "../../../../packages/template/scaffold/production/src/executable/render/node/planViewerVideo";

/**
 * Exact film clocks and stream mapping remain independent of browser execution.
 *
 * Scenarios:
 * 1. One frame and a fractional rate with integral extent retain exact counts.
 * 2. Silent output maps video only; sound maps its first audio stream and pads it.
 * 3. Fractional extents, unsafe clocks, bad rasters and exhausted budgets refuse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual portable planning and checks frame admission, stream input ordering, explicit duration/frame limits and invalid-request rejection.
 * @evidence contracts/development/testing.md#independent-expectations Counts follow duration multiplied by rate; literal FFmpeg mapping/padding options express the supported one-video optional-one-audio contract, without comparing to another implementation helper.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers singleton, fractional rate, silent/sound paths, fractional extent, NaN/infinity/zero clocks, odd raster and frame/byte/timeout limits. Existing headless-capture tests own completed seek and page lifecycle; actual host export remains root integration validation.
 * @evidence contracts/development/testing.md#execution-ownership Portable test calls planning only and starts no process, browser, GPU, installation or filesystem work.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: One frame and a fractional rate with integral extent retain exact counts.).
 */
export function test_viewer_video_plan(): void {
  const options: IAutoMovieViewerVideoOptions = {
    url: "http://localhost:5173/?capture=1",
    spec: {
      target: "film",
      frameFormat: { width: 640, height: 480, fps: 24 },
      toneMapping: "none",
      codec: "h264",
      pixelFormat: "yuv420p",
      crf: 18,
    },
    durationSeconds: 1,
    frameDir: "/frames",
    outputPath: "/film.mp4",
    chromeExecutable: "/chrome",
    ffmpegExecutable: "/ffmpeg",
  };
  const silent: ReturnType<typeof planViewerVideo> = planViewerVideo(options);
  TestValidator.equals("24 exact frames", silent.frameCount, 24);
  TestValidator.predicate(
    "silent video only",
    silent.args.includes("-an") &&
      silent.args.filter((value: string): boolean => value === "-i").length ===
        1,
  );
  TestValidator.equals(
    "explicit video clock",
    silent.args.slice(
      silent.args.indexOf("-frames:v"),
      silent.args.indexOf("-frames:v") + 2,
    ),
    ["-frames:v", "24"],
  );
  TestValidator.equals(
    "singleton admitted",
    planViewerVideo({ ...options, durationSeconds: 1 / 24 }).frameCount,
    1,
  );
  TestValidator.equals(
    "fractional rate exact extent",
    planViewerVideo({
      ...options,
      spec: {
        ...options.spec,
        frameFormat: { ...options.spec.frameFormat, fps: 2.5 },
      },
      durationSeconds: 2,
    }).frameCount,
    5,
  );
  const sound: ReturnType<typeof planViewerVideo> = planViewerVideo({
    ...options,
    audioMix: "/complete mix.wav",
  });
  TestValidator.equals(
    "audio input precedes output codec",
    sound.args.slice(
      sound.args.indexOf("-c:v") - 2,
      sound.args.indexOf("-c:v"),
    ),
    ["-i", "/complete mix.wav"],
  );
  TestValidator.predicate(
    "explicit soundtrack extent",
    sound.args.includes("1:a:0") &&
      sound.args.includes("apad") &&
      !sound.args.includes("-shortest") &&
      !sound.args.includes("-an"),
  );
  TestValidator.equals("explicit duration", sound.args.slice(-3), [
    "-t",
    "1",
    "/film.mp4",
  ]);
  const invalid: IAutoMovieViewerVideoOptions[] = [
    { ...options, durationSeconds: 0.1 },
    { ...options, durationSeconds: 0 },
    { ...options, durationSeconds: NaN },
    { ...options, durationSeconds: Infinity },
    { ...options, durationSeconds: Number.MAX_SAFE_INTEGER },
    { ...options, maxFrames: 23 },
    { ...options, maxFrameBytes: 0 },
    { ...options, maxFrames: NaN },
    { ...options, timeoutMs: Infinity },
    {
      ...options,
      spec: {
        ...options.spec,
        frameFormat: { ...options.spec.frameFormat, width: 639 },
      },
    },
    {
      ...options,
      spec: {
        ...options.spec,
        frameFormat: { ...options.spec.frameFormat, fps: 0 },
      },
    },
    { ...options, url: "file:///film" },
    { ...options, audioMix: "" },
    { ...options, chromeExecutable: "" },
  ];
  for (const [index, bad] of invalid.entries()) {
    let refused: boolean = false;
    try {
      planViewerVideo(bad);
    } catch {
      refused = true;
    }
    TestValidator.predicate(`invalid request ${index} refused`, refused);
  }
}
