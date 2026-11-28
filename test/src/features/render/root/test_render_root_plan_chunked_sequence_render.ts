import type {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieSequenceRenderPlan,
  IAutoMovieShot,
} from "@automovie/interface";import { AutoMovieRenderSequence } from "@automovie/render";;
import { TestValidator } from "@nestia/e2e";

const shot = (id: string, duration: number): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

const SEQUENCE: IAutoMovieSequence = {
  id: "seq:duel",
  name: "duel",
  fps: 24,
  shots: [
    { shot: "shot:a", trim: { start: 0, duration: 1 }, transition: null },
    { shot: "shot:b", trim: { start: 0, duration: 1.5 }, transition: null },
  ],
};

const SPEC: IAutoMovieRenderSpec = {
  target: SEQUENCE.id,
  frameFormat: { fps: 4, width: 640, height: 360 },
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 20,
};

/**
 * `planChunkedSequenceRender` cuts a sequence plan into fixed-size chunks.
 *
 * Scenarios:
 *
 * 1. A 2.5 s plan at 4 fps has 10 frames; chunks of 4 give 3 chunks over
 *    frames [0, 4), [4, 8) and [8, 10), numbered chunk_0 to chunk_2.
 * 2. Each chunk renumbers its frames from 0 into its own directory, with first
 *    and last frame names to match.
 * 3. The reassembly lists every chunk output in order by base name.
 * 4. With passes, each chunk gets pass outputs and each pass a manifest of
 *    every chunk directory.
 * 5. A chunk size of 0 is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cuts a sequence into locally numbered chunks and plans ordered reassembly and pass manifests.
 * @evidence contracts/development/testing.md#behavioral-verification Calls chunk planning on a ten-frame render with a four-frame limit, with and without passes, and with an invalid size.
 * @evidence contracts/development/testing.md#independent-expectations The half-open ranges 0–4, 4–8 and 8–10 give the exact chunk boundaries. The final chunk restarts at index zero and reassembly follows chunk order.
 */
export function test_render_root_plan_chunked_sequence_render(): void {
  const plan: IAutoMovieSequenceRenderPlan = AutoMovieRenderSequence.plan({
    sequence: SEQUENCE,
    shots: [shot("shot:a", 2), shot("shot:b", 2)],
    spec: SPEC,
  });
  TestValidator.equals("frames", plan.frames.length, 10);
  const chunked = AutoMovieRenderSequence.planChunked({ plan, spec: SPEC, chunkFrames: 4 });
  TestValidator.equals("chunk count", chunked.chunkCount, 3);
  TestValidator.equals(
    "ranges",
    chunked.chunks.map((chunk): number[] => [
      chunk.frameStart,
      chunk.frameEnd,
      chunk.frameCount,
    ]),
    [
      [0, 4, 4],
      [4, 8, 4],
      [8, 10, 2],
    ],
  );
  const last = chunked.chunks[2]!;
  TestValidator.equals("directory", last.frameDir, `${plan.frameDir}/chunk_2`);
  TestValidator.equals(
    "renumbered",
    last.frames.map((frame): number => frame.index),
    [0, 1],
  );
  TestValidator.equals("first", last.firstFrame, `${last.frameDir}/frame_00000.png`);
  TestValidator.equals("last", last.lastFrame, `${last.frameDir}/frame_00001.png`);
  TestValidator.equals(
    "chunk 1 starts at the plan's frame 4",
    chunked.chunks[1]!.startSeconds,
    plan.frames[4]!.timeSeconds,
  );
  TestValidator.equals(
    "concat lines",
    chunked.reassembly.concatListLines.length,
    3,
  );
  TestValidator.predicate(
    "concat lines are base names in order",
    chunked.reassembly.concatListLines.every(
      (line: string, index: number): boolean =>
        line.startsWith("file '") &&
        line.includes(`chunk_${index}`) &&
        !line.includes("/") &&
        !line.includes("\\"),
    ),
  );
  TestValidator.equals("no passes by default", chunked.passManifests, undefined);

  const passes = AutoMovieRenderSequence.planChunked({
    plan,
    spec: SPEC,
    chunkFrames: 4,
    passes: ["depth"],
  });
  TestValidator.equals(
    "manifest",
    passes.passManifests?.map((manifest): [string, number] => [
      manifest.pass,
      manifest.chunkFrameDirs.length,
    ]),
    [["depth", 3]],
  );
  TestValidator.equals(
    "pass outputs",
    passes.chunks.every((chunk): boolean => chunk.passOutputs !== undefined),
    true,
  );
  TestValidator.error("zero chunk", (): void => {
   AutoMovieRenderSequence.planChunked({ plan, spec: SPEC, chunkFrames: 0 });
  });
}