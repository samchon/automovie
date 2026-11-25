import { HumanSwordTiming } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The `HumanSwordCutAt` law's timing (`HumanSwordTiming.peak`): every movement
 * of the hand is one minimum-jerk unit (Flash and Hogan 1985), whose peak speed
 * is `UNIT` = 30/16 times its mean, so an attack along a path lasts `UNIT`
 * times the path over its peak speed.
 *
 * Scenarios:
 *
 * 1. A 0.8 m cut with no advance peaks at `1.875 · 0.8` = 1.5 m per unit speed.
 * 2. Carried wholly by an advancing body arriving at rest, its unit still peaks at
 *    `UNIT` times the path.
 * 3. Partly carried, the two units peak apart, so the sum's peak lies below the
 *    path's whole `UNIT` and above half of it.
 */
export function test_unit_motions_lexicon_sword_cut_at(): void {
  const half: number = HumanSwordTiming.peak(0.8, 0.4);
  TestValidator.predicate(
    "the attack's peak",
    nclose(HumanSwordTiming.UNIT, 30 / 16, 1e-12) &&
      nclose(HumanSwordTiming.peak(0.8, 0), 1.5, 1e-12) &&
      nclose(HumanSwordTiming.peak(0.8, 0.8), 1.5, 1e-12) &&
      half < 1.5 &&
      half > 0.75,
  );
}
