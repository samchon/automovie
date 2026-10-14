import { IAutoMovieScript, IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot, IAutoMovieStagedSet, performShot, stageScene } from "@automovie/engine";



import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Stages a valid duel and performs against two script beats sharing beat-1; failure and the second beat's id path detect ambiguous shot identity.
 *
 * Scenarios:
 * 1. Retains the coherent staged fixture while only duplicating the script beat; ordinary unique-beat admission is covered by perform_shot_valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages a valid duel and performs against two script beats sharing beat-1; failure and the second beat's id path detect ambiguous shot identity.
 * @evidence contracts/testing.md#independent-expectations The authored duplicate id must be refused at $script.beats[1].id; this checks identity admission, not downstream rendered output.
 * @evidence contracts/testing.md#distinguishing-cases Retains the coherent staged fixture while only duplicating the script beat; ordinary unique-beat admission is covered by perform_shot_valid.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_duplicate_script_beats unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_duplicate_script_beats(): void {
  const baseScript: IAutoMovieScript = makeScriptWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    baseScript,
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const performed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite({
      beats: [
        baseScript.beats[0]!,
        {
          ...baseScript.beats[0]!,
          name: "the duplicate charge",
          summary: "another planned shot sharing the same beat id",
        },
      ],
    }),
    staged,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });

  TestValidator.equals(
    "duplicate script beat ids fail",
    performed.success,
    false,
  );
  TestValidator.equals(
    "duplicate script beat id violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$script.beats[1].id"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
