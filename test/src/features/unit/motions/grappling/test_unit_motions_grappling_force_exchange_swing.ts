import type { IAutoMovieMotionHumanForceExchange } from "@automovie/interface";
import { HumanForceExchange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * How near the integrated swing keeps its energy and its release angle,
 * radians and radians per second: the integrator's step error over a swing.
 */
const INTEGRATION: number = 1e-3;

/**
 * `HumanForceExchange.swing` turns a rigid body about a fulcrum by `I φ'' = M g
 * r sin φ` from the momentum the pull left and releases it where its centre
 * comes level with the fulcrum, `φ = π / 2`. Without a drive the swing keeps
 * its energy, so the release rate is `sqrt(φ'0² + 2 k cos φ0)` with `k = M g r
 * / I`.
 *
 * A 70 kg body with 10 kg m² about its centre, 1 m from the fulcrum (`I = 80`
 * kg m²), at g = 10.
 *
 * Scenarios:
 *
 * 1. From 0.2 rad at 0.5 rad/s the swing starts there, releases at π / 2, at
 *    the energy's rate, and holds that state past the release.
 * 2. From 0.5 rad behind the vertical at 0.1 rad/s the rate falls to none
 *    before the vertical: no swing.
 */
export function test_unit_motions_grappling_force_exchange_swing(): void {
  const k: number = (70 * 10 * 1) / 80;
  const swing: IAutoMovieMotionHumanForceExchange.ISwing | null =
    HumanForceExchange.swing(
      { mass: 70, inertia: 10, radius: 1, angle: 0.2, rate: 0.5 },
      10,
    );
  TestValidator.predicate(
    "the conserved swing to its release",
    swing !== null &&
      swing.release > 0 &&
      nclose(swing.angle(0), 0.2, 1e-12) &&
      nclose(swing.angle(swing.release), Math.PI / 2, INTEGRATION) &&
      nclose(
        swing.rate(swing.release),
        Math.sqrt(0.25 + 2 * k * Math.cos(0.2)),
        INTEGRATION,
      ) &&
      swing.angle(swing.release + 1) === swing.angle(swing.release),
  );
  TestValidator.equals(
    "a swing that stops",
    HumanForceExchange.swing(
      { mass: 70, inertia: 10, radius: 1, angle: -0.5, rate: 0.1 },
      10,
    ),
    null,
  );
}
