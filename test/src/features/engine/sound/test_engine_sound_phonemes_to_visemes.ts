import { AutoMovieEngineSound } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `AutoMovieEngineSound.phonemesToVisemes` times each phoneme of a chunk with
 * an equal share of the chunk's samples.
 *
 * Scenarios:
 *
 * 1. A chunk `pa` over samples 0 to 100 gives `p` over 0 to 50 and `a` over 50 to
 *    100.
 * 2. A chunk that does not span an increasing interval is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines equal sample spans for successive phonemes and refusal for a non-increasing chunk.
 * @evidence contracts/development/testing.md#behavioral-verification Converts a two-phoneme chunk over 100 samples and submits one empty interval.
 * @evidence contracts/development/testing.md#independent-expectations Half of the fixed span is 50 samples, so the p and a windows meet at 50 and end at 100.
 */
export function test_engine_sound_phonemes_to_visemes(): void {
  const timed = AutoMovieEngineSound.phonemesToVisemes({
    chunks: [{ phonemes: "pa", startSample: 0, endSample: 100 }],
  });
  TestValidator.equals(
    "shares",
    timed.map((row) => [row.phoneme, row.startSample, row.endSample]),
    [
      ["p", 0, 50],
      ["a", 50, 100],
    ],
  );
  TestValidator.predicate(
    "empty interval",
    throwsError(() =>
      AutoMovieEngineSound.phonemesToVisemes({
        chunks: [{ phonemes: "pa", startSample: 5, endSample: 5 }],
      }),
    ),
  );
}
