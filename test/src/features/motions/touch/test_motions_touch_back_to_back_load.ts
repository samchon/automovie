import { backToBackLoad } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a quotient and a tangent. */
const ROUNDING: number = 1e-12;

/**
 * `backToBackLoad` is the share of the body's weight a trunk leaning back lays
 * on its partner: the trunk's mass share, the spine, chest, upper chest, neck
 * and head over the whole, times the tangent of the lean, at most one.
 *
 * Scenarios, a 70 kg body whose trunk weighs 10 + 8 + 5 + 1 + 5 = 29 kg and
 * whose hips weigh 11 kg:
 *
 * 1. Leaning 25 degrees lays `29 / 70 * tan 25` of the weight on the partner.
 * 2. Leaning the other way lays as much.
 * 3. Leaning 80 degrees would lay more than the whole weight: one.
 */
export function test_motions_touch_back_to_back_load(): void {
  const body: backToBackLoad.IBody = {
    massModel: {
      mass: 70,
      segments: [
        { bone: "hips", mass: 11 },
        { bone: "spine", mass: 10 },
        { bone: "chest", mass: 8 },
        { bone: "upperChest", mass: 5 },
        { bone: "neck", mass: 1 },
        { bone: "head", mass: 5 },
      ],
    },
  };
  const expected: number = (29 / 70) * Math.tan((25 * Math.PI) / 180);
  TestValidator.predicate(
    "the lean's share",
    nclose(backToBackLoad(body, 25), expected, ROUNDING) &&
      nclose(backToBackLoad(body, -25), expected, ROUNDING),
  );
  TestValidator.equals("at most the whole", backToBackLoad(body, 80), 1);
}
