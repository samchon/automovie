import {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  planChunkedSequenceRender,
  planSequenceRender,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";

const shot: (id: string, duration: number) => IAutoMovieShot = (id: string, duration: number): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

const SHOTS: IAutoMovieShot[] = [shot("shot:a", 2)];

const SEQUENCE: IAutoMovieSequence = {
  id: "seq:solo",
  name: "solo",
  fps: 24,
  shots: [{ shot: "shot:a", trim: null, transition: null }],
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
 * Requesting no guide passes changes nothing: the chunk plan without a `passes`
 * argument retains the same plan shape as an explicitly undefined argument:
 * the pass fields are absent. No historical serialized artifact is loaded.
 *
 * Scenarios:
 *
 * 1. Plans built with and without `passes: undefined` deep-equal each other.
 * 2. Neither the chunks nor the plan carry the pass keys at all (`in` checks):
 *    absence, not emptiness, so pre-#644 consumers see the exact same object
 *    shape.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans the same eight-frame sequence with omitted and explicitly undefined guide passes, compares complete records and requires passOutputs/passManifests keys to be absent. Exact count/index checks accompany tolerant time/rate comparison so an empty-field fallback or changed partition fails.
 * @evidence contracts/testing.md#independent-expectations An omitted optional request and undefined both request no guide outputs; absence is independently asserted with key membership. Whole-plan comparison is a metamorphic no-op oracle, not an independent historical pre-644 snapshot or rendered-pixel proof.
 * @evidence contracts/testing.md#distinguishing-cases Keeps omitted and explicitly undefined neighbors with every chunk checked for key absence and the parent manifest key absent. Explicit empty, nonempty, repeated and malformed pass requests belong to chunk_guide_passes.
 * @evidence contracts/testing.md#execution-ownership The named test_render_chunk_guide_passes_twin owns these portable synchronous planner twins and no hidden registered cases; it captures/writes no frames and starts no renderer or encoder.
 */
export function test_render_chunk_guide_passes_twin(): void {
  const whole: ReturnType<typeof planSequenceRender> = planSequenceRender({
    sequence: SEQUENCE,
    shots: SHOTS,
    spec: SPEC,
  });
  const bare: ReturnType<typeof planChunkedSequenceRender> = planChunkedSequenceRender({
    plan: whole,
    spec: SPEC,
    chunkFrames: 3,
  });
  const explicit: ReturnType<typeof planChunkedSequenceRender> = planChunkedSequenceRender({
    plan: whole,
    spec: SPEC,
    chunkFrames: 3,
    passes: undefined,
  });

  TestValidator.predicate(
    "undefined passes deep-equals the bare plan",
    (): boolean => filmEffectValuesClose(explicit, bare),
  );
  TestValidator.equals(
    "undefined passes preserve exact frame counts and indices",
    [explicit.frameCount, explicit.chunkFrames, explicit.chunkCount,
      ...explicit.chunks.flatMap((chunk: typeof explicit.chunks[number]): number[] =>
        [chunk.index, chunk.frameStart, chunk.frameEnd, chunk.frameCount,
          ...chunk.frames.map((frame: typeof chunk.frames[number]): number => frame.index)])],
    [bare.frameCount, bare.chunkFrames, bare.chunkCount,
      ...bare.chunks.flatMap((chunk: typeof bare.chunks[number]): number[] =>
        [chunk.index, chunk.frameStart, chunk.frameEnd, chunk.frameCount,
          ...chunk.frames.map((frame: typeof chunk.frames[number]): number => frame.index)])],
  );
  TestValidator.equals(
    "no chunk carries the passOutputs key",
    bare.chunks.every((chunk: typeof bare.chunks[number]): boolean => !("passOutputs" in chunk)),
    true,
  );
  TestValidator.equals(
    "the plan carries no passManifests key",
    "passManifests" in bare,
    false,
  );
}
