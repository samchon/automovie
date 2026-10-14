import { IAutoMovieRenderSpec } from "@automovie/interface";
import {
  IAutoMovieRenderAdapters,
  IAutoMovieRenderAndSeeRequest,
  IAutoMovieRenderAndSeeResult,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { renderAndSee } from "@automovie/render";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { nclose } from "../internal/nclose";

const SPEC: IAutoMovieRenderSpec = {
  target: "shot-1",
  frameFormat: { fps: 4, width: 320, height: 180 },
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 22,
};

/**
 * `renderAndSee` turns the render pipeline into an agent-readable artifact:
 * explicit sample times, captured frame paths, ffmpeg args, and encoded
 * output.
 *
 * Scenarios:
 *
 * 1. A 0.5 s clip at 4 fps captures two frames, encodes once, and returns JSON-round-trippable metadata matching the host adapter calls.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes renderAndSee through its declared capture/encode seams and observes the spec, duration, schedule, returned paths, frame records, encoder destination and JSON round trip, catching lost or reordered orchestration metadata.
 * @evidence contracts/testing.md#independent-expectations The authored half-second duration at four fps gives two samples at zero and one quarter second; callback-defined paths and fixed requested destinations determine the expected strings. Numeric artifact leaves use nclose through the shared record comparator, while discrete frame counts, indices and callback order remain exact.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the original one-clip, two-frame case, distinguishing requested encoder output, returned capture paths and the planned numbered input pattern. Refusals and sequence/blend behavior belong to the render_video and render_sequence tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable async test_render_and_see owns this portable orchestration case; injected callbacks record calls and return strings without drawing frames, writing files or starting ffmpeg, a browser or a GPU.
 */
export async function test_render_and_see(): Promise<void> {
  const captured: Array<{ timeSeconds: number; index: number; dir: string }> =
    [];
  const encoded: Array<{ args: string[]; outputPath: string }> = [];
  const adapters: IAutoMovieRenderAdapters = {
    captureFrame: async (
      timeSeconds: number,
      index: number,
      dir: string,
    ): Promise<string> => {
      captured.push({ timeSeconds, index, dir });
      return `${dir}/frame-${index}.png`;
    },
    encode: async (args: string[], outputPath: string): Promise<string> => {
      encoded.push({ args, outputPath });
      return outputPath;
    },
  };
  const request: IAutoMovieRenderAndSeeRequest = {
    spec: SPEC,
    durationSeconds: 0.5,
    frameDir: "frames/shot-1",
    outputPath: "out/shot-1.mp4",
    adapters,
  };
  const result: IAutoMovieRenderAndSeeResult = await renderAndSee(request);

  TestValidator.predicate(
    "spec snapshot",
    filmEffectValuesClose(result.spec, SPEC),
  );
  TestValidator.predicate(
    "duration reported",
    nclose(result.durationSeconds, 0.5),
  );
  TestValidator.equals("output path", result.output, "out/shot-1.mp4");
  TestValidator.equals("frame count", result.frameCount, 2);
  TestValidator.predicate(
    "sample times",
    filmEffectValuesClose(result.times, [0, 0.25]),
  );
  TestValidator.predicate(
    "captured calls",
    filmEffectValuesClose(captured, [
      { timeSeconds: 0, index: 0, dir: "frames/shot-1" },
      { timeSeconds: 0.25, index: 1, dir: "frames/shot-1" },
    ]),
  );
  TestValidator.equals(
    "capture indices and directories",
    captured.map((call: (typeof captured)[number]): [number, string] => [
      call.index,
      call.dir,
    ]),
    [
      [0, "frames/shot-1"],
      [1, "frames/shot-1"],
    ],
  );
  TestValidator.predicate(
    "frame artifacts",
    filmEffectValuesClose(result.frames, [
      {
        index: 0,
        timeSeconds: 0,
        path: "frames/shot-1/frame-0.png",
      },
      {
        index: 1,
        timeSeconds: 0.25,
        path: "frames/shot-1/frame-1.png",
      },
    ]),
  );
  TestValidator.equals(
    "frame indices",
    result.frames.map(
      (frame: IAutoMovieRenderAndSeeResult["frames"][number]): number =>
        frame.index,
    ),
    [0, 1],
  );
  TestValidator.equals(
    "input pattern",
    result.inputPattern,
    "frames/shot-1/frame_%05d.png",
  );
  TestValidator.equals("encode call count", encoded.length, 1);
  TestValidator.equals(
    "encoded output arg",
    encoded[0]!.outputPath,
    "out/shot-1.mp4",
  );
  TestValidator.predicate(
    "json artifact round trip",
    filmEffectValuesClose(
      JSON.parse(JSON.stringify(result)) as unknown,
      result,
    ),
  );
}
