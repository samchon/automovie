import { AutoMovieEngineKinematics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** The bisection stops at 2^-40 of the segment. */
const BISECTION: number = 2 ** -38;

/**
 * `swingConeBlend` is the largest fraction `t` of the segment from an anchor to
 * an end at which the swing cone angle stays within the limit.
 *
 * Scenarios:
 *
 * 1. An end already inside the limit gives 1.
 * 2. Along one axis the cone angle is linear in `t`, so flexion 0 -> 90 under a 45
 *    degree limit gives t = 1/2.
 * 3. From an anchor of 20 degrees to 80 under a 50 degree limit, t = 1/2.
 */
export function test_engine_rom_swing_cone_blend(): void {
  TestValidator.equals("inside the limit", AutoMovieEngineKinematics.swingConeBlend(30, 0, 0, 0, 45), 1);
  TestValidator.predicate(
    "half the segment",
    nclose(AutoMovieEngineKinematics.swingConeBlend(90, 0, 0, 0, 45), 0.5, BISECTION),
  );
  TestValidator.predicate(
    "from an anchor",
    nclose(AutoMovieEngineKinematics.swingConeBlend(80, 0, 20, 0, 50), 0.5, BISECTION),
  );
}
