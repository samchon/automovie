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
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";

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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs valid output and a renamed staged scene, checking the product's artifact self-check admits both.
 * @evidence contracts/development/testing.md#independent-expectations The explicit staged input bypasses stage admission, so the producer's final check alone decides; any scene id is a valid identity.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains the valid fixture and a one-property renamed neighbour; ordinary authored input refusals belong to other entries.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_self_check unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Admit the original valid fixture.).
 */
export function test_film_perform_shot_self_check(): void {
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
