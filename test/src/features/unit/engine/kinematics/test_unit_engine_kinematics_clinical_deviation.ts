import { clinicalDeviation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `clinicalDeviation` is the squared distance of a joint from its neutral pose:
 * `flexion^2 + abduction^2 + twist^2`.
 *
 * Scenarios:
 *
 * 1. (3, -4, 12) gives 9 + 16 + 144 = 169.
 * 2. The neutral pose gives 0.
 */
export function test_unit_engine_kinematics_clinical_deviation(): void {
  TestValidator.equals(
    "the squared sum",
    clinicalDeviation({ flexion: 3, abduction: -4, twist: 12 }),
    169,
  );
  TestValidator.equals(
    "neutral",
    clinicalDeviation({ flexion: 0, abduction: 0, twist: 0 }),
    0,
  );
}
