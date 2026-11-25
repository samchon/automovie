import { updateRecoveryRegularization } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `updateRecoveryRegularization` scales the damping by the accepted-radius
 * factor of the agreement ratio rho: 1 / 3 for rho >= 1, else max(1 / 3, 1 -
 * (2 rho - 1)^3).
 *
 * Scenarios:
 *
 * 1. From damping 3, an actual decrease 4 against 4 predicted (rho = 1) gives
 *    factor 1 / 3 and damping 1.
 * 2. Actual 1 against 2 (rho = 1 / 2) gives factor 1 and damping 3.
 * 3. Actual 1 / 4 against 1 (rho = 1 / 4) gives factor 1 - (-1 / 2)^3 = 9 / 8
 *    and damping 27 / 8.
 * 4. A missing prediction supports no update and keeps the damping.
 * 5. A damping that is not positive is refused.
 */
export function test_recovery_internal_update_regularization(): void {
  const full: ReturnType<typeof updateRecoveryRegularization> =
    updateRecoveryRegularization(3, 4, 4);
  TestValidator.equals("agreement accepted", full.reason, "accepted-agreement");
  TestValidator.predicate(
    "full agreement",
    nclose(full.factor!, 1 / 3, 1e-15) && nclose(full.damping, 1, 1e-15),
  );
  const half: ReturnType<typeof updateRecoveryRegularization> =
    updateRecoveryRegularization(3, 1, 2);
  TestValidator.predicate(
    "half agreement",
    nclose(half.ratio!, 0.5, 1e-15) &&
      nclose(half.factor!, 1, 1e-15) &&
      nclose(half.damping, 3, 1e-15),
  );
  const poor: ReturnType<typeof updateRecoveryRegularization> =
    updateRecoveryRegularization(3, 0.25, 1);
  TestValidator.predicate(
    "poor agreement",
    nclose(poor.factor!, 9 / 8, 1e-15) && nclose(poor.damping, 27 / 8, 1e-15),
  );
  const missing: ReturnType<typeof updateRecoveryRegularization> =
    updateRecoveryRegularization(3, 1, null);
  TestValidator.equals("no prediction", missing.supported, false);
  TestValidator.equals("damping kept", missing.damping, 3);
  TestValidator.error("zero damping", (): unknown =>
    updateRecoveryRegularization(0, 1, 1),
  );
}
