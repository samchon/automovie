import { cutSequence } from "../../../../packages/engine/src/film/cutSequence";
import { IAutoMovieCut } from "../../../../packages/engine/src/film/IAutoMovieCut";
import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { IAutoMovieMotion, IAutoMovieScript, IAutoMovieSkeleton } from "@automovie/interface";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

/**
 * Run the stage/perform/cut spine and serialize its scenes, shots, compiled
 * motions, sequence and runtime. Motion keyframes are retained as produced;
 * the owning entry requires nonempty output rather than per-frame density.
 */
const runPipeline: () => { serialized: string; motionKeyframes: number } = (): { serialized: string; motionKeyframes: number } => {
  const script: IAutoMovieScript = makeScriptWrite({
    beats: [
      {
        id: "beat-1",
        name: "the charge",
        summary: "knightA charges knightB",
        durationHint: 2,
      },
      {
        id: "beat-2",
        name: "the aftermath",
        summary: "knightB celebrates over the fallen challenger",
        durationHint: 2,
      },
    ],
  });

  const staged: IAutoMovieStagedSet = stageScene(script, makeStagingWrite());
  if (staged.success !== true) throw new Error("staging fixture must succeed");

  const charge: IAutoMoviePerformedShot = performShot({
    script,
    staged,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  const aftermath: IAutoMoviePerformedShot = performShot({
    script,
    staged,
    performance: makePerformanceWrite({
      beat: "beat-2",
      plan: "the champion raises his arms; camera holds.",
      draft: [
        {
          verb: "gesture",
          actor: "knightB",
          start: 0,
          duration: 2,
          kind: "celebrate",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  if (charge.success !== true || aftermath.success !== true)
    throw new Error("perform fixtures must succeed");

  const cut: IAutoMovieCut = cutSequence(
    {
      sequence: { id: "seq-duel", name: "duel at dawn" },
      fps: 24,
      entries: [
        { shot: charge.shot.id, trim: null, transition: null },
        {
          shot: aftermath.shot.id,
          trim: { start: 0, duration: 1.5 },
          transition: { kind: "crossDissolve", duration: 0.5 },
        },
      ],
      pacing: "the charge runs full; the aftermath breathes then cuts.",
      continuity: "the dissolve carries the fall into the celebration.",
    },
    [charge.shot, aftermath.shot],
  );
  if (cut.success !== true) throw new Error("cut fixture must succeed");

  return { serialized: JSON.stringify({
    scenes: [staged.scene],
    shots: [charge.shot, aftermath.shot],
    motions: [charge.motions, aftermath.motions],
    sequence: cut.sequence,
    runtime: cut.runtime,
  }), motionKeyframes: [...Object.values(charge.motions), ...Object.values(aftermath.motions)].reduce((count: number, motion: IAutoMovieMotion): number => count + motion.keyframes.length, 0) };
};

/**
 * Runs the same stage/perform/cut spine twice and compares serialized returned artifacts, including compiled motion samples, to detect differing repeated output.
 *
 * Scenarios:
 * 1. Retains two complete two-beat pipelines and the nonempty motion-output check; per-value geometry and clock tests own independent correctness.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the same stage/perform/cut spine twice and compares serialized returned artifacts, including compiled motion samples, to detect differing repeated output.
 * @evidence contracts/testing.md#independent-expectations Reproducibility requires equality for identical inputs in this process; the second actual result is a relational oracle rather than a committed output snapshot. Both runs can share a deterministic numerical bug and establish no cross-process or cross-host equivalence.
 * @evidence contracts/testing.md#distinguishing-cases Retains two complete two-beat pipelines and the nonempty motion-output check; per-value geometry and clock tests own independent correctness.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_pipeline_determinism unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_pipeline_determinism(): void {
  const first: { serialized: string; motionKeyframes: number } = runPipeline();
  const second: { serialized: string; motionKeyframes: number } = runPipeline();

  TestValidator.equals(
    "the full pipeline serializes byte-identically across two runs",
    first.serialized,
    second.serialized,
  );
  TestValidator.equals(
    "each serialized pipeline includes nonempty motion keyframes",
    namedFacts([
      ["firstCarriesMotionSamples", (): boolean => first.motionKeyframes > 0],
      ["secondCarriesMotionSamples", (): boolean => second.motionKeyframes > 0],
    ]),
    { firstCarriesMotionSamples: true, secondCarriesMotionSamples: true },
  );
}
