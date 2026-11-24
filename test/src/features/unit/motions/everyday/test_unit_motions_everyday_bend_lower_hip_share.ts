import { bendLower } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few cosines and a quotient. */
const ROUNDING: number = 1e-12;

/**
 * `bendLower.hipShare` is the share of the standing hip height a strategy
 * keeps: the knee flexed by the strategy's `KNEE`, the shank tilted by half of
 * it but no more than the crouching ankle's `ANKLE` and the strategy's heel
 * lift, the thigh by the rest: the ankle height, the shank's and the thigh's
 * heights summed, `a + s cos(shank) + t cos(knee - shank)`, over the standing
 * `a + s + t`.
 *
 * Scenarios, for a 0.08 m ankle height, a 0.42 m shank and a 0.45 m thigh:
 *
 * 1. A stoop (knee 30) tilts each by 15 degrees.
 * 2. A semi-squat (knee 90) tilts the shank by the ankle's 28 and the thigh by 62.
 * 3. A squat (knee 135, heel 30) tilts the shank by 58 and the thigh by 77.
 * 4. The deeper the strategy, the lower the hips.
 */
export function test_unit_motions_everyday_bend_lower_hip_share(): void {
  const body: Parameters<typeof bendLower.hipShare>[0] = {
    measure: { ankleHeight: 0.08, shank: 0.42, thigh: 0.45 },
  };
  const share = (shank: number, thigh: number): number => {
    const r: number = Math.PI / 180;
    return (
      (0.08 + 0.42 * Math.cos(shank * r) + 0.45 * Math.cos(thigh * r)) / 0.95
    );
  };
  const stoop: number = bendLower.hipShare(body, "stoop");
  const semi: number = bendLower.hipShare(body, "semiSquat");
  const squat: number = bendLower.hipShare(body, "squat");
  TestValidator.predicate("a stoop", nclose(stoop, share(15, 15), ROUNDING));
  TestValidator.predicate(
    "a semi-squat",
    nclose(semi, share(28, 62), ROUNDING),
  );
  TestValidator.predicate("a squat", nclose(squat, share(58, 77), ROUNDING));
  TestValidator.predicate("deeper is lower", stoop > semi && semi > squat);
}
