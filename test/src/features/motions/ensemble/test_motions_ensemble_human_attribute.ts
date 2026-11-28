import type { IAutoMovieMotionHumanAttributeEffects } from "@automovie/interface";
import {
  HumanAttribute
} from "../../../../../packages/motions/src/ensemble/internal/HumanAttribute";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

namespace part_human_attribute_draw {
  /** Rounding of one product and sum, unitless. */
  const ROUNDING: number = 1e-12;

  /**
   * `HumanAttribute.draw` gives one member's value of a quantity from the
   * group's distribution, clipped to [0, 1]: the mean itself with no spread,
   * otherwise the mean plus the spread times a deviate of the member's own
   * keyed stream, so the same key draws the same value. A mean outside [0, 1]
   * or a negative spread is refused.
   *
   * Scenarios:
   *
   * 1. No spread gives the mean.
   * 2. The same seed, ensemble, member and name draw the same value.
   * 3. A uniform deviate lies within `sqrt(3)` spreads of the mean, and every draw
   *    within [0, 1].
   * 4. A mean of 1.5 and a spread of -0.1 are refused.
   */
  export function verify(): void {
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
}

namespace part_human_attribute_effect {
  /** Rounding of one product and sum, in the effect's units. */
  const ROUNDING: number = 1e-12;

  /**
   * `HumanAttribute.effect` reads an effect linearly between its value at the
   * attribute's low end and its high end, `low + (high - low) x`, an absent
   * attribute read at the neutral value.
   *
   * Scenarios:
   *
   * 1. An effect from 0.8 to 1.2 at 0, 1 and 0.25 is 0.8, 1.2 and 0.9.
   * 2. An absent attribute with a neutral of 0.5 reads 1.
   */
  export function verify(): void {
    const effect: IAutoMovieMotionHumanAttributeEffects.IEffect = {
      low: 0.8,
      high: 1.2,
    };
    TestValidator.predicate(
      "linear between its ends",
      nclose(HumanAttribute.effect(effect, 0, 0.5), 0.8, ROUNDING) &&
        nclose(HumanAttribute.effect(effect, 1, 0.5), 1.2, ROUNDING) &&
        nclose(HumanAttribute.effect(effect, 0.25, 0.5), 0.9, ROUNDING),
    );
    TestValidator.predicate(
      "an absent attribute",
      nclose(HumanAttribute.effect(effect, undefined, 0.5), 1, ROUNDING),
    );
  }
}

/**
 * Check seeded attribute draws and interpolation of an attribute's effect.
 *
 * Scenarios:
 *
 * 1. Read the mean with zero spread. Repeat one keyed draw, bound the uniform
 *    spread and clip draws to [0, 1]. Refuse a mean of 1.5 or a spread of
 *    -0.1.
 * 2. An effect from 0.8 to 1.2 reads 0.8, 1.2 and 0.9 at attributes 0, 1 and
 *    0.25. A missing attribute uses the neutral input 0.5 and reads 1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the draw distribution, refusal inputs and neutral effect.
 * @evidence contracts/development/testing.md#behavioral-verification The draw and effect functions are checked separately with keyed controls and literal endpoints.
 * @evidence contracts/development/testing.md#independent-expectations The draw bounds follow the stated uniform spread and clipping. The effect uses the straight line through 0.8 and 1.2.
 */
export async function test_motions_ensemble_human_attribute(): Promise<void> {
  part_human_attribute_draw.verify();
  part_human_attribute_effect.verify();
}
