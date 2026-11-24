import { AutoMovieGravity } from "@automovie/engine";
import { juggleTiming } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `juggleTiming` solves a pattern's times by Shannon's theorem `(F + D) H = (V
 * + D) N` for two hands at a dwell ratio `k`, here three quarters.
 *
 * Scenarios, a 0.6 m throw, its flight `F = sqrt(4.8 / g)`:
 *
 * 1. A three-ball cascade dwells `1.5 F / 1.5 = F` and is empty `F / 3`, so `(F +
 *    D) 2 = (V + D) 3`; its least height for a 0.12 s vacancy is the one whose
 *    flight is 0.36 s, `g 0.36² / 8`.
 * 2. A two-ball shower dwells `0.5 F / 0.25 = 2F` and is empty `2F / 3`, its two
 *    flights averaging `2F / 3`.
 */
export function test_unit_motions_exercise_juggle_timing(): void {
  const g: number = AutoMovieGravity.STANDARD;
  const F: number = Math.sqrt(4.8 / g);
  const cascade: juggleTiming.ITiming = juggleTiming({
    pattern: "cascade",
    balls: 3,
    height: 0.6,
    ratio: 0.75,
    vacancy: 0.12,
  });
  TestValidator.predicate(
    "the cascade",
    nclose(cascade.flight, F, 1e-12) &&
      nclose(cascade.dwell, F, 1e-12) &&
      nclose(cascade.vacancy, F / 3, 1e-12) &&
      nclose(
        (cascade.flight + cascade.dwell) * 2,
        (cascade.vacancy + cascade.dwell) * 3,
        1e-12,
      ) &&
      nclose(cascade.least, (g * 0.36 * 0.36) / 8, 1e-12),
  );
  const shower: juggleTiming.ITiming = juggleTiming({
    pattern: "shower",
    balls: 2,
    height: 0.6,
    ratio: 0.75,
    vacancy: 0.12,
  });
  TestValidator.predicate(
    "the shower",
    nclose(shower.dwell, 2 * F, 1e-12) &&
      nclose(shower.vacancy, (2 * F) / 3, 1e-12),
  );
}
