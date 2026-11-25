import type {
  IAutoMovieRenderAdapters,
  IAutoMovieRenderResult,
  IAutoMovieRenderSpec,
} from "@automovie/interface";
import { renderVideo } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose, rejectsError } from "../../../internal/predicates";

/** A clip at four samples a second has exactly representable sample times here. */
const CLOCK_TOLERANCE: number = 0;

/** The capture and encode decisions the host receives for this clip. */
const SPEC: IAutoMovieRenderSpec = {
  target: "clip",
  frameFormat: { fps: 4, width: 16, height: 16 },
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 20,
};

/**
 * The clip renderer awaits each frame before the next and describes the paths
 * returned by the host.
 *
 * Scenarios:
 *
 * 1. A half-second clip at 4 fps captures samples 0 and 0.25 in order, then
 *    encodes. The result preserves capture paths and the encoded name.
 * 2. A subframe request refuses before calling any adapter. A frame refusal
 *    also leaves the encoder uncalled.
 */
export async function test_unit_render_root_render_video(): Promise<void> {
  const events: string[] = [];
  const captured: number[] = [];
  const adapters: IAutoMovieRenderAdapters = {
    captureFrame: async (seconds: number, index: number, dir: string): Promise<string> => {
      events.push(`capture ${dir} ${index}`);
      captured.push(seconds);
      await Promise.resolve();
      events.push(`done ${index}`);
      return `written-${index}.png`;
    },
    encode: async (args: string[], output: string): Promise<string> => {
      events.push(`encode ${output}`);
      TestValidator.equals("encoder source and destination", [args[args.indexOf("-i") + 1], args.at(-1)],
        ["capture/frame_%05d.png", "result.mp4"]);
      return "encoded.mp4";
    },
  };
  const result: IAutoMovieRenderResult = await renderVideo(SPEC, 0.5, "capture", "result.mp4", adapters);
  TestValidator.equals("adapter order", events, [
    "capture capture 0", "done 0", "capture capture 1", "done 1", "encode result.mp4",
  ]);
  TestValidator.equals("result paths and indices", [result.output, result.frameCount, result.frames.map((frame) => [frame.index, frame.path])],
    ["encoded.mp4", 2, [[0, "written-0.png"], [1, "written-1.png"]]]);
  TestValidator.predicate("sample times appear in the calls and the manifest", () =>
    captured.length === 2 && result.times.length === 2 &&
    [0, 0.25].every((expected: number, index: number): boolean =>
      nclose(captured[index]!, expected, CLOCK_TOLERANCE) &&
      nclose(result.times[index]!, expected, CLOCK_TOLERANCE) &&
      nclose(result.frames[index]!.timeSeconds, expected, CLOCK_TOLERANCE),
    ),
  );

  events.length = 0;
  TestValidator.predicate("empty capture refuses", await rejectsError(
    () => renderVideo(SPEC, 0.0625, "capture", "result.mp4", adapters), "zero frames",
  ));
  TestValidator.equals("no empty capture effects", events, []);

  TestValidator.predicate("capture refusal propagates", await rejectsError(
    () => renderVideo(SPEC, 0.75, "capture", "result.mp4", {
      ...adapters,
      captureFrame: async (seconds: number, index: number, dir: string): Promise<string> => {
        if (index === 1) throw new Error("capture refused");
        return adapters.captureFrame(seconds, index, dir);
      },
    }), "capture refused",
  ));
  TestValidator.equals("no later frame or encoding after failure", events, ["capture capture 0", "done 0"]);
}
