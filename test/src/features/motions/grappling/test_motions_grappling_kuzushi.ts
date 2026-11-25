import { kuzushi } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `kuzushi` law's tip (`kuzushi.tipped`): a minimum-jerk tip over 0.5 s,
 * held, and a minimum-jerk return over 0.5 s.
 *
 * Scenario: held 1 s, half tipped at 0.25 s, fully at 0.5 s and through 1.5 s,
 * half back at 1.75 s, upright at 2 s and after.
 */
export function test_motions_grappling_kuzushi(): void {
  TestValidator.predicate(
    "the tip and its return",
    kuzushi.TIP === 0.5 &&
      nclose(kuzushi.tipped(1, 0), 0, 1e-12) &&
      nclose(kuzushi.tipped(1, 0.25), 0.5, 1e-12) &&
      nclose(kuzushi.tipped(1, 0.5), 1, 1e-12) &&
      nclose(kuzushi.tipped(1, 1.5), 1, 1e-12) &&
      nclose(kuzushi.tipped(1, 1.75), 0.5, 1e-12) &&
      nclose(kuzushi.tipped(1, 2), 0, 1e-12) &&
      nclose(kuzushi.tipped(1, 5), 0, 1e-12),
  );
}
