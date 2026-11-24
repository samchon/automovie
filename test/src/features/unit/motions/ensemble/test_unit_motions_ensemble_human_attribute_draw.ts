import { HumanAttribute } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one product and sum, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `HumanAttribute.draw` gives one member's value of a quantity from the group's
 * distribution, clipped to [0, 1]: the mean itself with no spread, otherwise
 * the mean plus the spread times a deviate of the member's own keyed stream, so
 * the same key draws the same value. A mean outside [0, 1] or a negative
 * spread is refused.
 *
 * Scenarios:
 *
 * 1. No spread gives the mean.
 * 2. The same seed, ensemble, member and name draw the same value.
 * 3. A uniform deviate lies within `sqrt(3)` spreads of the mean, and every
 *    draw within [0, 1].
 * 4. A mean of 1.5 and a spread of -0.1 are refused.
 */
export function test_unit_motions_ensemble_human_attribute_draw(): void {
  TestValidator.predicate(
    "no spread",
    nclose(
      HumanAttribute.draw("seed", "squad", 3, "morale", {
        mean: 0.7,
        spread: 0,
      }),
      0.7,
      ROUNDING,
    ),
  );
  const once: number = HumanAttribute.draw("seed", "squad", 3, "fatigue", {
    mean: 0.5,
    spread: 0.1,
    shape: "uniform",
  });
  TestValidator.equals(
    "the same key draws the same",
    HumanAttribute.draw("seed", "squad", 3, "fatigue", {
      mean: 0.5,
      spread: 0.1,
      shape: "uniform",
    }),
    once,
  );
  TestValidator.predicate(
    `within the uniform's reach (${once})`,
    Math.abs(once - 0.5) <= Math.sqrt(3) * 0.1 + ROUNDING,
  );
  for (let index: number = 0; index < 8; index++) {
    const value: number = HumanAttribute.draw("seed", "squad", index, "x", {
      mean: 0.95,
      spread: 0.5,
    });
    TestValidator.predicate(
      `clipped to [0, 1] (${value})`,
      value >= 0 && value <= 1,
    );
  }
  TestValidator.error("a mean outside [0, 1]", () =>
    HumanAttribute.draw("seed", "squad", 0, "morale", {
      mean: 1.5,
      spread: 0,
    }),
  );
  TestValidator.error("a negative spread", () =>
    HumanAttribute.draw("seed", "squad", 0, "morale", {
      mean: 0.5,
      spread: -0.1,
    }),
  );
}
