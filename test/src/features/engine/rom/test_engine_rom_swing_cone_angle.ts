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
 */
export function test_engine_rom_swing_cone_angle(): void {
  TestValidator.predicate("one axis", nclose(AutoMovieEngineKinematics.swingConeAngle(90, 0), 90, 1e-12));
  TestValidator.predicate(
    "both axes",
    nclose(AutoMovieEngineKinematics.swingConeAngle(90, 90), 120, 1e-12),
  );
  TestValidator.equals("no swing", AutoMovieEngineKinematics.swingConeAngle(0, 0), 0);
}
