import { performShot, stageScene } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMotion,
  IAutoMoviePerformance,
  IAutoMoviePerformedShot,
  IAutoMovieScript,
  IAutoMovieSkeleton,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../../../internal/filmFixtures";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * `performShot` turns a performance plan into compiled clips for the staged
 * cast and self-checks the result.
 *
 * Fixture: the duel script and staging; a one-second `wave` gesture by
 * `knightA`; the valid synthesizer.
 *
 * Scenarios:
 *
 * 1. The valid fixture performs, and so does the same staged set under another
 *    scene id ("scene-duel").
 * 2. Two script beats sharing beat-1 fail with a type finding at
 *    `$script.beats[1].id`.
 * 3. A synthesizer whose elbow key reaches 200 degrees of flexion fails, and the
 *    range-of-motion finding is remapped to the compiled `knightA` clip with a
 *    positive overshoot.
 */
export function test_unit_engine_film_perform_shot(): void {
  const script: IAutoMovieScript = makeScriptWrite();
  const result: IAutoMovieStagedSet = stageScene(script, makeStagingWrite());
  if (result.success !== true) throw new Error("staging fixture must succeed");
  const staged: IAutoMovieStagedSet.ISuccess = result;
  const performance: IAutoMoviePerformance = makePerformanceWrite({
    draft: [
      {
        verb: "gesture",
        actor: "knightA",
        start: 0,
        duration: 1,
        kind: "wave",
      },
    ],
    revise: { review: "unchanged.", final: null },
  });
  const skeleton = (): IAutoMovieSkeleton => createSkeleton();

  const valid: IAutoMoviePerformedShot = performShot({
    script,
    staged,
    performance,
    synthesize: validSynthesizer,
    skeleton,
  });
  TestValidator.equals("valid performs", valid.success, true);
  const renamed: IAutoMoviePerformedShot = performShot({
    script,
    staged: { ...staged, scene: { ...staged.scene, id: "scene-duel" } },
    performance,
    synthesize: validSynthesizer,
    skeleton,
  });
  TestValidator.equals("renamed scene performs", renamed.success, true);

  const duplicate: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite({
      beats: [
        script.beats[0]!,
        {
          ...script.beats[0]!,
          name: "the duplicate charge",
          summary: "another planned shot sharing the same beat id",
        },
      ],
    }),
    staged,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton,
  });
  TestValidator.equals("duplicate beats fail", duplicate.success, false);
  TestValidator.predicate(
    "duplicate beat path",
    duplicate.success === false &&
      hasViolation(duplicate, "type", "$script.beats[1].id"),
  );

  const excessive: IAutoMoviePerformedShot = performShot({
    script,
    staged,
    performance,
    synthesize: (): IAutoMovieMotion =>
      makeMotion(
        [
          keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
          keyframe(1, makePose([joint("leftLowerArm", { flexion: 200 })])),
        ],
        1,
      ),
    skeleton,
  });
  TestValidator.equals("excessive flexion fails", excessive.success, false);
  TestValidator.predicate(
    "rom remapped onto the compiled clip",
    excessive.success === false &&
      excessive.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.kind === "rom" &&
          v.path.startsWith('$compiled["knightA"]') &&
          (v.overshoot ?? 0) > 0,
      ),
  );
}
