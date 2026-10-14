import {
  IAutoMovieConstraintViolation,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

/**
 * Performs an elbow clip with 200-degree flexion and checks a ROM refusal remapped to the compiled knight clip with positive overshoot.
 *
 * Scenarios:
 * 1. Retains rest and excessive keys and checks the refused compiled branch; valid ROM behavior is exercised by perform_shot_valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs an elbow clip with 200-degree flexion and checks a ROM refusal remapped to the compiled knight clip with positive overshoot.
 * @evidence contracts/testing.md#independent-expectations The elbow's supported 150-degree flexion limit makes 200 excessive; the expected compiled path and positive excess are independent of the validator's emitted numerical magnitude.
 * @evidence contracts/testing.md#distinguishing-cases Retains rest and excessive keys and checks the refused compiled branch; valid ROM behavior is exercised by perform_shot_valid.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_rom_gate unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_rom_gate(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const performed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
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
    }),
    synthesize: (): IAutoMovieMotion =>
      makeMotion(
        [
          keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
          keyframe(1, makePose([joint("leftLowerArm", { flexion: 200 })])),
        ],
        1,
      ),
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("fails", performed.success, false);
  TestValidator.equals(
    "rom violation remapped onto the compiled clip",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          performed.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.kind === "rom" &&
              v.path.startsWith('$compiled["knightA"]') &&
              (v.overshoot ?? 0) > 0,
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
