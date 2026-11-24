import { poleVaultTakeoffAngle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `poleVaultTakeoffAngle` gives a vaulter's take-off angle from the run-up
 * speed by the linear regression it cites: 48.8 degrees less 3.51 per m/s.
 *
 * Scenarios:
 *
 * 1. At 9 m/s the angle is 48.8 - 31.59 = 17.21 degrees; it falls as the run
 *    quickens.
 */
export function test_unit_motions_sport_pole_vault_takeoff_angle(): void {
  TestValidator.predicate(
    "the take-off angle at 9 m/s, falling with speed",
    nclose(poleVaultTakeoffAngle(9), 17.21, 1e-12) &&
      poleVaultTakeoffAngle(9.5) < poleVaultTakeoffAngle(9),
  );
}
