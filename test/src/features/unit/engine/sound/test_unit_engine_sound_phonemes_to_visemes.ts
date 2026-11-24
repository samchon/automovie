import { productionPhonemesToVisemes } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `productionPhonemesToVisemes` times each phoneme of a chunk with an equal
 * share of the chunk's samples.
 *
 * Scenarios:
 *
 * 1. A chunk `pa` over samples 0 to 100 gives `p` over 0 to 50 and `a` over 50 to
 *    100.
 * 2. A chunk that does not span an increasing interval is refused.
 */
export function test_unit_engine_sound_phonemes_to_visemes(): void {
  const timed = productionPhonemesToVisemes({
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
      productionPhonemesToVisemes({
        chunks: [{ phonemes: "pa", startSample: 5, endSample: 5 }],
      }),
    ),
  );
}
