import { AutoMovieEngineKinematics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `swingConeAngle` is the angle of the composed orthogonal swing, `2
 * acos(cos(F/2) cos(A/2))`, in degrees.
 *
 * Scenarios:
 *
 * 1. A single axis: (90, 0) is 90°.
 * 2. Both at 90°: 2 acos(½) = 120°.
 * 3. No swing: 0°.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the single-axis, orthogonal two-axis and zero swing cases.
 * @evidence contracts/development/testing.md#behavioral-verification Passes three explicit degree pairs directly to Kinematics.swingConeAngle.
 * @evidence contracts/development/testing.md#independent-expectations One 90-degree rotation gives 90 degrees. Half-angle scalar products for two orthogonal quarter turns are one half, giving 2 acos(1/2) or 120 degrees.
 */
export function test_engine_rom_swing_cone_angle(): void {
  TestValidator.predicate("one axis", nclose(AutoMovieEngineKinematics.swingConeAngle(90, 0), 90, 1e-12));
  TestValidator.predicate(
    "both axes",
    nclose(AutoMovieEngineKinematics.swingConeAngle(90, 90), 120, 1e-12),
  );
  TestValidator.equals("no swing", AutoMovieEngineKinematics.swingConeAngle(0, 0), 0);
}
