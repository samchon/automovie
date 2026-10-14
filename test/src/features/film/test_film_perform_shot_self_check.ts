import {
  IAutoMoviePerformance,
  IAutoMovieScene,
  IAutoMovieScript,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot, IAutoMovieStagedSet, performShot, stageScene } from "@automovie/engine";



import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { throwsError } from "../internal/predicates";

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
 * Performs valid output and an explicit staged empty scene id, checking the product's artifact self-check throws a located engine-defect diagnosis and a nonempty neighbor succeeds.
 *
 * Scenarios:
 * 1. Admit the original valid fixture.
 * 2. Catch an explicitly staged empty scene id through the producer self-check.
 * 3. Admit its nonempty scene-id neighbour.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs valid output and an explicit staged empty scene id, checking the product's artifact self-check throws a located engine-defect diagnosis and a nonempty neighbor succeeds.
 * @evidence contracts/testing.md#independent-expectations A shot artifact needs a nonblank scene identity; the explicit staged input bypasses stage admission so the producer's final check must catch the gap. The expected error fragments establish diagnosis, not all possible self-check failures.
 * @evidence contracts/testing.md#distinguishing-cases Retains valid fixture, empty scene-id defect and one-property nonempty counterexample; ordinary authored input refusals belong to other entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_self_check unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_self_check(): void {
  // 1. valid output passes the check silently.
  TestValidator.equals("a valid shot performs", perform(staged).success, true);

  // 2. and 3. the gap the net catches, with the diagnosis it carries.
  const emptySceneId: typeof staged = {
    ...staged,
    scene: { ...staged.scene, id: "" } as IAutoMovieScene,
  };
  TestValidator.predicate(
    "an unguarded empty scene id is caught by the producer's self-check",
    throwsError(
      (): IAutoMoviePerformedShot => perform(emptySceneId),
      ["$input.scene", "engine defect"],
    ),
  );
  TestValidator.predicate(
    "the counter-case one property away still performs",
    perform({
      ...staged,
      scene: { ...staged.scene, id: "scene-duel" } as IAutoMovieScene,
    }).success === true,
  );
}
