import { blockBeat, stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Pins non-finite timeline values that comparison-only gates can miss.
 *
 * Scenarios:
 *
 * 1. `duration = Infinity` yields `range` on `$input.duration`.
 * 2. `anchor.t = NaN` yields `range` on `$input.actors[0].anchors[0].t`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls blockBeat on separately infinite-duration and NaN-anchor plans after valid staging and requires located range refusals, catching comparison-only timeline checks that admit nonfinite operands.
 * @evidence contracts/testing.md#independent-expectations Beat duration and cue time must be finite under the blocking contract; literal Infinity and NaN violate that premise independently of any emitted performance. Expected fields follow the authored duration and first anchor locations.
 * @evidence contracts/testing.md#distinguishing-cases Isolates positive Infinity in beat duration from NaN in an otherwise finite beat's anchor; zero duration and finite outside or reversed anchors are covered by test_film_block_beat_invalid, and finite admitted anchors by the valid-plan test.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_block_beat_non_finite_timeline entry owns the portable staging call and both direct blocking cases, using existing fixtures without a consumer installation, native artifact or running host.
 */
export function test_film_block_beat_non_finite_timeline(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const infiniteDuration: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite(),
    staged,
    makeBlockingWrite({ duration: Number.POSITIVE_INFINITY }),
  );
  TestValidator.equals(
    "infinite duration fails",
    infiniteDuration.success,
    false,
  );
  TestValidator.equals(
    "infinite duration rejected",
    namedFacts([
      ["refused", (): boolean => infiniteDuration.success === false],
      [
        "violated",
        (): boolean =>
          infiniteDuration.success === false &&
          hasViolation(infiniteDuration, "range", "$input.duration"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const nanAnchor: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite(),
    staged,
    makeBlockingWrite({
      actors: [
        {
          node: "knightA",
          beats: "lands on an undefined cue time",
          anchors: [{ t: Number.NaN, cue: "undefined beat" }],
        },
      ],
    }),
  );
  TestValidator.equals("nan anchor fails", nanAnchor.success, false);
  TestValidator.equals(
    "nan anchor rejected",
    namedFacts([
      ["refused", (): boolean => nanAnchor.success === false],
      [
        "violated",
        (): boolean =>
          nanAnchor.success === false &&
          hasViolation(nanAnchor, "range", "$input.actors[0].anchors[0].t"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
