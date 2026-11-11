import type { IAutoMovieRenderSpec } from "@automovie/interface";
import {
  AutoMovieDrawSession,
  type IAutoMovieCaptureSubject,
  type IAutoMovieDrawCall,
  decodeAutoMovieRasterPng,
  renderAutoMovieDrawnVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { answerDrawCall } from "./answerDrawCall";
import { createDrawPageDouble } from "./createDrawPageDouble";

/** A film of half a second at 8 fps, delivered at 16 by 10. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "starter",
  durationSeconds: 0.5,
  fps: 8,
  width: 16,
  height: 10,
  views: [],
  drawables: [],
  marks: [],
};

/**
 * A delivered video is every frame of the subject's clock drawn by the page's draw function, written as numbered PNG files in order, then encoded once with the planned arguments.
 *
 * Scenarios:
 *
 * 1. Half a second at 8 fps draws four frames, at 0, 0.125, 0.25 and 0.375 s, each through the film's own camera in the beauty pass at the subject's 16 by 10 raster.
 * 2. Each is written as `frames/frame_0000<i>.png` before the next is drawn, and decodes to the page's picture, rows from the top.
 * 3. The encoder runs once, after the last write, with the subject's 8 fps and 16x10 raster in the vector and four frames cut at 0.5 s.
 * 4. A subject whose clock is not a whole number of frames is refused before any frame is drawn.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public renderer through a draw session over a recording page and recording write and encode functions; a renderer that skipped or reordered frames, drew another view, pass or raster, wrote out of order, encoded before the last frame or with another frame format fails.
 * @evidence contracts/development/testing.md#independent-expectations Frame seconds are `i / fps` of the half-open clock; file names are the shared `frame_%05d.png` pattern; the pixels are the page double's, so a decoded file shows what the page drew.
 * @evidence contracts/development/testing.md#distinguishing-cases A whole clock against a fractional one, and the subject's clock and raster set by the subject alone. The encoder vector's every argument is owned by `test_render_video_encoding_plan`; screenshots and styles cannot occur, since the page double has no such call, which `test_draw_delivery_frame` pins.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_drawn_video`; the page, files and encoder are in-memory doubles and nothing is launched.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_draw_drawn_video(): Promise<void> {
  const spec: Omit<IAutoMovieRenderSpec, "frameFormat"> = {
    target: "production",
    toneMapping: "none",
    codec: "h264",
    pixelFormat: "yuv420p",
    crf: 18,
  };
  const open: (subject: IAutoMovieCaptureSubject) => Promise<{ session: AutoMovieDrawSession; double: createDrawPageDouble.IDouble }> = async (
    subject: IAutoMovieCaptureSubject,
  ): Promise<{ session: AutoMovieDrawSession; double: createDrawPageDouble.IDouble }> => {
    const double: createDrawPageDouble.IDouble = createDrawPageDouble({ subject, renderer: "test", answer: answerDrawCall });
    return {
      double,
      session: await AutoMovieDrawSession.open({
        page: double.page,
        url: "http://127.0.0.1:1/render/index.html",
        props: { subject: subject.name, props: null },
        backend: "swiftshader",
        timeout: 1000,
      }),
    };
  };

  const { session, double } = await open(SUBJECT);
  const log: string[] = [];
  const files: Map<string, Uint8Array> = new Map();
  const result: Awaited<ReturnType<typeof renderAutoMovieDrawnVideo>> = await renderAutoMovieDrawnVideo({
    session,
    spec,
    frameDir: "frames",
    outputPath: "film.mp4",
    audio: null,
    write: async (path: string, data: Uint8Array): Promise<void> => {
      log.push(`write ${path}`);
      files.set(path, data);
    },
    encode: async (args: readonly string[]): Promise<void> => {
      log.push(`encode ${args.join(" ")}`);
    },
  });

  // 1. The draws.
  const calls: IAutoMovieDrawCall[] = double.calls
    .slice(4)
    .map((call: createDrawPageDouble.ICall): IAutoMovieDrawCall => (call.arg as { call: IAutoMovieDrawCall }).call);
  TestValidator.equals(
    "four frames through the film camera",
    calls.map((call: IAutoMovieDrawCall): unknown[] => [call.seconds, call.view, call.request.shade, call.width, call.height]),
    [0, 0.125, 0.25, 0.375].map((seconds: number): unknown[] => [seconds, "film", "beauty", 16, 10]),
  );

  // 2. The writes, in order, with the page's pixels.
  TestValidator.equals(
    "numbered files in order, then one encode",
    log.map((line: string): string => line.split(" ")[0] === "encode" ? "encode" : line),
    ["write frames/frame_00000.png", "write frames/frame_00001.png", "write frames/frame_00002.png", "write frames/frame_00003.png", "encode"],
  );
  const decoded: { width: number; height: number; pixels: Uint8ClampedArray } = await decodeAutoMovieRasterPng(files.get("frames/frame_00002.png")!);
  TestValidator.equals(
    "the page's picture",
    [decoded.width, decoded.height, Array.from(decoded.pixels.subarray((3 * 16 + 5) * 4, (3 * 16 + 5) * 4 + 4))],
    [16, 10, [3, 5, 7, 255]],
  );
  TestValidator.equals("the result lists the frames", result.frames.map((frame: { file: string }): string => frame.file), [...files.keys()]);

  // 3. The encode uses the subject's clock and raster.
  const encoded: string = log.at(-1)!;
  TestValidator.predicate(
    "the subject's rate, raster and clock",
    ["-framerate 24", "-framerate 30", "-s 1280x720"].every((part: string): boolean => !encoded.includes(part)) &&
      ["-framerate 8", "-s 16x10", "-frames:v 4", "-t 0.5", "frames/frame_%05d.png"].every((part: string): boolean =>
        encoded.includes(part),
      ),
  );

  // 4. A fractional clock.
  const odd: { session: AutoMovieDrawSession; double: createDrawPageDouble.IDouble } = await open({ ...SUBJECT, durationSeconds: 0.51 });
  const message: string = await renderAutoMovieDrawnVideo({
    session: odd.session,
    spec,
    frameDir: "frames",
    outputPath: "film.mp4",
    audio: null,
    write: async (): Promise<void> => {},
    encode: async (): Promise<void> => {},
  })
    .then((): string => "")
    .catch((error: unknown): string => (error instanceof Error ? error.message : String(error)));
  TestValidator.predicate("a fractional clock is refused", message.includes("whole number of frames"));
  TestValidator.equals("before any draw", odd.double.calls.length, 4);
}
