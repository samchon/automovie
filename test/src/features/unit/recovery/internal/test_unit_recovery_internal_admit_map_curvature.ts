import { admitRecoveryMapCurvature } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `admitRecoveryMapCurvature` sizes the curvature arrays from the camera width
 * w, the points p and the observations n: width = w + 3p, coefficients = width
 * + n (w + 3), seed = 4n + 256, optional = 8 (w^2 + 3 p w + 9 p + coefficients
 * + width + n + 1) + 8192, fixed = base + 256, complete = fixed + seed +
 * optional, and it is eligible when it fits the resident and linear limits.
 *
 * Scenarios:
 *
 * 1. w = 6, p = 2, n = 4, base 100: width 12, coefficients 48, seed 272,
 *    optional 9432, fixed 356, complete 10060 and work 718976; with room it is
 *    eligible and retains 10060, and it charges 512.
 * 2. With a resident limit of 5000 it is not eligible and retains the fixed
 *    356.
 * 3. A base of zero is refused.
 */
export function test_unit_recovery_internal_admit_map_curvature(): void {
  let charged: number = 0;
  const charge = (work: number): void => {
    charged += work;
  };
  const roomy = admitRecoveryMapCurvature(6, 2, 4, 100, 100000, 100000, charge);
  TestValidator.equals("eligible", roomy.eligible, true);
  TestValidator.equals("retained", roomy.retainedEntries, 10060);
  TestValidator.equals("work", roomy.work, 718976);
  TestValidator.equals("charged", charged, 512);
  const tight = admitRecoveryMapCurvature(6, 2, 4, 100, 5000, 100000, charge);
  TestValidator.equals("not eligible", tight.eligible, false);
  TestValidator.equals("fixed only", tight.retainedEntries, 356);
  TestValidator.error("a zero base", (): unknown =>
    admitRecoveryMapCurvature(6, 2, 4, 0, 100000, 100000, charge),
  );
}
