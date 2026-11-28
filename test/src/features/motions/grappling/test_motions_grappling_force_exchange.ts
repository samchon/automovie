import { AutoMovieEngineMotionTrajectory } from "@automovie/engine";
import type { IAutoMovieMotionHumanForceExchange, IAutoMovieMotionHumanSustainedForce, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanForceDrawn
} from "../../../../../packages/motions/src/grappling/internal/HumanForceDrawn";
import {
  HumanForceExchange
} from "../../../../../packages/motions/src/grappling/internal/HumanForceExchange";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A 0.2 m square base on the floor about the origin. */
const SQUARE: IAutoMovieVector3[] = [
  { x: -0.1, y: 0, z: -0.1 },
  { x: 0.1, y: 0, z: -0.1 },
  { x: 0.1, y: 0, z: 0.1 },
  { x: -0.1, y: 0, z: 0.1 },
];

/**
 * The release's bracket, seconds: the swing bisects for the release to
 * `AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep()²` and returns the bracket's end past it
 * (`bracketedBisection`), so the read release lies at most this long after the
 * true one.
 */
const BRACKET: number = AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep() ** 2;

/** The swing's stiffness `M g r / I`, per second squared. */
const K: number = (70 * 10 * 1) / 80;

/**
 * The fixed-step classical Runge-Kutta method's global error over the swing,
 * radians: fourth order, `O((ω h)⁴)` for a pendulum of rate scale `ω = sqrt(K)`
 * at the step `h` (Hairer, Nørsett and Wanner, Solving Ordinary Differential
 * Equations I, 2nd ed., 1993, §II.3).
 */
const RK4: number = (Math.sqrt(K) * AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep()) ** 4;

/**
 * Check the mechanical calculations used for a paired force exchange.
 *
 * Scenarios:
 *
 * 1. Compare a 63 N pull on a 70 kg pendulum with offset, speed and
 *    extrapolation in closed form. Calculate a pull that crosses the base in
 *    one second.
 * 2. Measure the edge of a square base and divide 100 N equally between two
 *    grips. Compare static resistance for 0.2 and 0.1 m base reaches.
 * 3. Compare swing release speed and angle with conserved energy. An
 *    insufficient initial swing has no release.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the pendulum, footprint, grip force, torque and release controls.
 * @evidence contracts/development/testing.md#behavioral-verification Separate fixtures exercise the draw, break, footprint edge, shared force, static resistance and fulcrum motion.
 * @evidence contracts/development/testing.md#independent-expectations The assertions use the inverted pendulum formulas, square geometry, torque balance and gravitational energy.
 */
export function test_motions_grappling_force_exchange(): void {
  // 1. Drawn.
  const offset: number = 0.1 * (Math.cosh(3) - 1);
  const speed: number = 0.3 * Math.sinh(3);
  const drawn: IAutoMovieMotionHumanForceExchange.IDrawnResult =
    HumanForceExchange.drawn({ mass: 70, frequency: 3, force: 63, seconds: 1 });
  TestValidator.predicate(
    "the pendulum's closed form",
    nclose(drawn.offset, offset, 1e-12) &&
      nclose(drawn.speed, speed, 1e-12) &&
      nclose(drawn.extrapolated, offset + speed / 3, 1e-12) &&
      nclose(
        HumanForceDrawn.prepare({ mass: 70, frequency: 3, force: 63 }).offset(
          1,
        ),
        offset,
        1e-12,
      ) &&
      HumanForceDrawn.prepare({ mass: 70, frequency: 3, force: 63 }).sample(-1)
        .offset === 0,
  );

  // 2. Breaking a base.
  const pull: number = HumanForceExchange.breaking({
    mass: 70,
    frequency: 3,
    edge: 0.1,
    seconds: 1,
  });
  TestValidator.predicate(
    "the breaking pull and its instant",
    nclose(pull, 63 / (Math.exp(3) - 1), 1e-9) &&
      nclose(
        HumanForceExchange.broken({
          mass: 70,
          frequency: 3,
          edge: 0.1,
          force: pull,
        }),
        1,
        1e-9,
      ),
  );

  // 3. The base's edge.
  TestValidator.predicate(
    "the hull's extent along a direction",
    nclose(
      HumanForceExchange.edge(
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        SQUARE,
      ),
      0.1,
      1e-12,
    ) &&
      nclose(
        HumanForceExchange.edge(
          { x: 0, y: 1, z: 0 },
          { x: Math.SQRT1_2, y: 0, z: Math.SQRT1_2 },
          SQUARE,
        ),
        0.1 * Math.SQRT2,
        1e-12,
      ) &&
      HumanForceExchange.edge(
        { x: 0.2, y: 1, z: 0 },
        { x: 1, y: 0, z: 0 },
        SQUARE,
      ) === 0,
  );

  // 4. The pull over its grips.
  TestValidator.equals(
    "an equal share per grip",
    HumanForceExchange.pull({
      subject: "uke",
      sites: ["sternum", { bone: "leftLowerArm", point: { x: 0, y: 0, z: 0 } }],
      direction: { x: 1, y: 0, z: 0 },
      force: 100,
      from: 1,
      to: 2,
    }),
    [
      {
        kind: "sustained",
        subject: "uke",
        at: "sternum",
        from: 1,
        to: 2,
        force: { x: 50, y: 0, z: 0 },
      },
      {
        kind: "sustained",
        subject: "uke",
        at: { bone: "leftLowerArm", point: { x: 0, y: 0, z: 0 } },
        from: 1,
        to: 2,
        force: { x: 50, y: 0, z: 0 },
      },
    ] satisfies IAutoMovieMotionHumanSustainedForce[],
  );

  // 5. Resisted.
  const resisted = (edge: number): number | null =>
    HumanForceExchange.resisted({ mass: 70, force: 100, height: 1, edge }, 10);
  TestValidator.predicate(
    "the moment balance's shift",
    nclose(resisted(0.2)!, 1 / 7, 1e-12) && resisted(0.1) === null,
  );

  // 6. The swing.
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
      HumanForceExchange.swing(
        { mass: 70, inertia: 10, radius: 1, angle: -0.5, rate: 0.1 },
        10,
      ) === null,
  );
}
