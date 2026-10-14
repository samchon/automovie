import { IAutoMovieRenderSpec } from "@automovie/interface";
import { IAutoMovieRenderAdapters, renderVideo } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const SPEC: IAutoMovieRenderSpec = {
  target: "shot-1",
  frameFormat: { fps: 24, width: 640, height: 480 },
  toneMapping: "acesFilmic",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 18,
};

/** Await the supplied operation and require every diagnostic fragment on its Error. */
const rejectsError: (
  task: () => Promise<unknown>,
  messageIncludes?: string | readonly string[],
) => Promise<boolean> = async (
  task: () => Promise<unknown>,
  messageIncludes: string | readonly string[] = [],
): Promise<boolean> => {
  const fragments: readonly string[] =
    typeof messageIncludes === "string" ? [messageIncludes] : messageIncludes;
  try {
    await task();
    return false;
  } catch (error) {
    return (
      error instanceof Error &&
      fragments.every((fragment: string): boolean =>
        error.message.includes(fragment),
      )
    );
  }
};

/**
 * The render orchestration over injected I/O: it captures one frame per
 * scheduled instant in order, then encodes the sequence: pure control flow, so
 * a fake capture/encode pair drives it deterministically.
 *
 * Scenario: a 1 s clip at 24 fps captures 24 frames (each adapter call recorded
 * with its time and index, in order) and encodes once to the requested output;
 * the result reports the frame count, the schedule, and the output path.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the actual renderVideo orchestration through its declared capture/encode ports and checks count, endpoint artifacts, returned paths, exact ffmpeg arguments and zero-frame refusal before either port runs.
 * @evidence contracts/testing.md#independent-expectations A one-second 24-fps clip expects 24 frames and endpoint times 0 and 23/24, checked with zero-tolerance nclose; literal paths and encoder arguments come directly from the authored spec, not another planner.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts a valid schedule with zero fps and records capture count plus endpoint indices; intermediate capture ordering and exactly-one successful encode are not separately counted by these assertions.
 * @evidence contracts/testing.md#execution-ownership Owns asynchronous callbacks through the public supported I/O seam, records arguments in memory and awaits both render/refusal paths; no frame file, ffmpeg process or video pixels are produced, and the portable runner owns execution.
 */
export async function test_render_video(): Promise<void> {
  const captured: Array<{ t: number; i: number }> = [];
  let encodeArgs: string[] | null = null;

  const adapters: IAutoMovieRenderAdapters = {
    captureFrame: async (
      timeSeconds: number,
      index: number,
      dir: string,
    ): Promise<string> => {
      captured.push({ t: timeSeconds, i: index });
      return `${dir}/frame_${index}.png`;
    },
    encode: async (args: string[], outputPath: string): Promise<string> => {
      encodeArgs = args;
      return outputPath;
    },
  };

  const result: Awaited<ReturnType<typeof renderVideo>> = await renderVideo(
    SPEC,
    1,
    "/tmp/x",
    "/tmp/out.mp4",
    adapters,
  );

  TestValidator.equals("24 frames captured", result.frameCount, 24);
  TestValidator.equals("schedule length", result.times.length, 24);
  TestValidator.equals("output path returned", result.output, "/tmp/out.mp4");
  TestValidator.equals("frame dir reported", result.frameDir, "/tmp/x");
  TestValidator.equals(
    "input pattern reported",
    result.inputPattern,
    "/tmp/x/frame_%05d.png",
  );
  TestValidator.predicate(
    "first frame artifact",
    Object.keys(result.frames[0]!).length === 3 &&
      result.frames[0]!.index === 0 &&
      nclose(result.frames[0]!.timeSeconds, 0, 0) &&
      result.frames[0]!.path === "/tmp/x/frame_0.png",
  );
  TestValidator.predicate(
    "last frame artifact",
    Object.keys(result.frames[23]!).length === 3 &&
      result.frames[23]!.index === 23 &&
      nclose(result.frames[23]!.timeSeconds, 23 / 24, 0) &&
      result.frames[23]!.path === "/tmp/x/frame_23.png",
  );
  TestValidator.equals("captured every frame in order", captured.length, 24);
  TestValidator.equals("first capture index 0", captured[0]!.i, 0);
  TestValidator.equals("last capture index 23", captured[23]!.i, 23);
  const matchesFfmpegInvocation: (args: string[] | null) => boolean = (
    args: string[] | null,
  ): boolean => args !== null && args[0] === "-y" && args.includes("libx264");
  TestValidator.predicate(
    "encode received the ffmpeg args",
    matchesFfmpegInvocation(encodeArgs),
  );
  TestValidator.equals("result records ffmpeg args", result.ffmpegArgs, [
    "-y",
    "-framerate",
    "24",
    "-i",
    "/tmp/x/frame_%05d.png",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-r",
    "24",
    "-s",
    "640x480",
    "-movflags",
    "+faststart",
    "/tmp/out.mp4",
  ]);

  let rejectedCaptures: number = 0;
  let rejectedEncodes: number = 0;
  const rejectingAdapters: IAutoMovieRenderAdapters = {
    captureFrame: async (): Promise<string> => {
      ++rejectedCaptures;
      return "/tmp/unreachable.png";
    },
    encode: async (): Promise<string> => {
      ++rejectedEncodes;
      return "/tmp/unreachable.mp4";
    },
  };
  TestValidator.predicate(
    "zero-frame render rejects before host io",
    await rejectsError(
      (): ReturnType<typeof renderVideo> =>
        renderVideo(
          { ...SPEC, frameFormat: { ...SPEC.frameFormat, fps: 0 } },
          1,
          "/tmp/x",
          "/tmp/out.mp4",
          rejectingAdapters,
        ),
      ["renderVideo", "at least one frame", "zero frames"],
    ),
  );
  TestValidator.equals("zero-frame render skips capture", rejectedCaptures, 0);
  TestValidator.equals("zero-frame render skips encode", rejectedEncodes, 0);
}
