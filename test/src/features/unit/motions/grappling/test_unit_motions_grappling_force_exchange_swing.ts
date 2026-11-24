import { integrateMotionTrajectory } from "@automovie/engine";
import type { IAutoMovieMotionHumanForceExchange } from "@automovie/interface";
import { HumanForceExchange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The release's bracket, seconds: the swing bisects for the release to
 * `integrateMotionTrajectory.STEP²` and returns the bracket's end past it
 * (`bracketedBisection`), so the read release lies at most this long after the
 * true one.
 */
const BRACKET: number = integrateMotionTrajectory.STEP ** 2;

/** The swing's stiffness `M g r / I`, per second squared. */
const K: number = (70 * 10 * 1) / 80;

/**
 * The fixed-step classical Runge-Kutta method's global error over the swing,
 * radians: fourth order, `O((ω h)⁴)` for a pendulum of rate scale `ω =
 * sqrt(K)` at the step `h` (Hairer, Nørsett and Wanner, Solving Ordinary
 * Differential Equations I, 2nd ed., 1993, §II.3).
 */
const RK4: number = (Math.sqrt(K) * integrateMotionTrajectory.STEP) ** 4;

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
 * 1. From 0.2 rad at 0.5 rad/s the swing starts there and releases at π / 2, read
 *    at most `BRACKET` late: the angle exceeds it by at most the release rate
 *    times `BRACKET`, and the rate exceeds the energy's by at most `K` times
 *    `BRACKET`, each within the method's `RK4` error; past the release the
 *    state holds.
 * 2. From 0.5 rad behind the vertical at 0.1 rad/s the rate falls to none before
 *    the vertical: no swing.
 */
export function test_unit_motions_grappling_force_exchange_swing(): void {
  const rate: number = Math.sqrt(0.25 + 2 * K * Math.cos(0.2));
  const within = (value: number, low: number, high: number): boolean =>
    value >= low && value <= high;
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
      within(
        swing.angle(swing.release),
        Math.PI / 2 - RK4,
        Math.PI / 2 + rate * BRACKET + RK4,
      ) &&
      within(
        swing.rate(swing.release),
        rate - Math.sqrt(K) * RK4,
        rate + K * BRACKET + Math.sqrt(K) * RK4,
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
