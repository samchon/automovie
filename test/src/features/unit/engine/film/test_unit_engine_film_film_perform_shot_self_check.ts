import { performShot, stageScene } from "@automovie/engine";
import {
  IAutoMoviePerformance,
  type IAutoMoviePerformedShot,
  IAutoMovieScene,
  IAutoMovieScript,
  IAutoMovieSkeleton,
  type IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../../../internal/filmFixtures";
import { createSkeleton } from "../../../internal/fixtures";

const script: IAutoMovieScript = makeScriptWrite();

const staged: IAutoMovieStagedSet.ISuccess =
  ((): IAutoMovieStagedSet.ISuccess => {
    const result: IAutoMovieStagedSet = stageScene(script, makeStagingWrite());
    if (result.success !== true)
      throw new Error("staging fixture must succeed");
    return result;
  })();

const performance: IAutoMoviePerformance = makePerformanceWrite({
  draft: [
    { verb: "gesture", actor: "knightA", start: 0, duration: 1, kind: "wave" },
  ],
  revise: { review: "unchanged.", final: null },
});

const perform: (
  set: IAutoMovieStagedSet.ISuccess,
) => IAutoMoviePerformedShot = (set: typeof staged): IAutoMoviePerformedShot =>
  performShot({
    script,
    staged: set,
    performance,
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });

/**
 * Performs valid output, including a staged scene under another id, and checks the product's artifact self-check lets both through.
 *
 * Scenarios:
 * 1. Admit the original valid fixture.
 * 2. Admit the same staged set under another scene id.
 */
export function test_unit_engine_film_film_perform_shot_self_check(): void {
  // 1. valid output passes the check silently.
  TestValidator.equals("a valid shot performs", perform(staged).success, true);

  // 2. a renamed scene still performs.
  TestValidator.predicate(
    "a renamed scene still performs",
    perform({
      ...staged,
      scene: { ...staged.scene, id: "scene-duel" } as IAutoMovieScene,
    }).success === true,
  );
}
