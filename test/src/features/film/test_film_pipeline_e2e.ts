import {
  IAutoMovieScript,
  IAutoMovieSequenceEntry,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieCut, IAutoMoviePerformedShot, IAutoMovieStagedSet, cutSequence, performShot, stageScene } from "@automovie/engine";





import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/**
 * Stage one script, perform two beats and cut the returned shots, checking
 * successful admission, scene linkage, cut ordering and a three-second runtime.
 *
 * Scenarios:
 * 1. Stage the shared duel and perform both authored beats.
 * 2. Preserve the shared scene join in both returned shots.
 * 3. Cut the whole first shot and trimmed second shot with the authored overlap, preserving order and runtime.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages one script, performs its two beats and cuts the actual shots, checking successful admission, scene linkage, cut ordering and a three-second runtime. This catches a lost beat/scene join or incorrect assembled overlap length without claiming every refusal branch is exercised.
 * @evidence contracts/testing.md#independent-expectations The authored two-second shot plus 1.5-second trim minus 0.5-second dissolve gives three seconds; authored beat and scene references determine the joins independently.
 * @evidence contracts/testing.md#distinguishing-cases Retains the duel and celebration, whole first shot, trimmed second shot and overlap; this positive unit spine owns no LLM interaction, host render or malformed-stage coverage.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_pipeline_e2e unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_pipeline_e2e(): void {
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
  TestValidator.equals("staging", staged.success, true);
  if (staged.success !== true) return;

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
  TestValidator.equals("charge performed", charge.success, true);
  TestValidator.equals("aftermath performed", aftermath.success, true);
  if (charge.success !== true || aftermath.success !== true) return;
  TestValidator.equals(
    "shots thread the staged scene",
    [charge.shot.scene, aftermath.shot.scene],
    [staged.scene.id, staged.scene.id],
  );

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
  TestValidator.equals("cut", cut.success, true);
  if (cut.success !== true) return;
  TestValidator.equals(
    "cut order",
    cut.sequence.shots.map((s: IAutoMovieSequenceEntry): string => s.shot),
    ["shot:beat-1", "shot:beat-2"],
  );
  TestValidator.predicate("runtime 3 s", nclose(cut.runtime, 3));
}
