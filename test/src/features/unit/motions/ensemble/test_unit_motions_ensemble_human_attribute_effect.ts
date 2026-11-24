import type { IAutoMovieMotionHumanAttributeEffects } from "@automovie/interface";
import { HumanAttribute } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
export function test_unit_motions_ensemble_human_attribute_effect(): void {
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
