import { AutoMovieEngineGravity, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieResolveBalanceOutcome,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `resolveAutoMovieBalanceOutcome(props)` classifies a push on a standing
 * linear inverted pendulum: the extrapolated centre x + v / w0 inside the base
 * absorbs it (Hof 2005), outside it the capture point diverges as d0 exp(w0 t)
 * until a foot lands within reach + margin, and past the fixed point d* =
 * (reach + margin) a / (a - 1), a = exp(w0 step), the body falls.
 *
 * Fixture: 70 kg, pendulum 1 m (w0 = sqrt g), centre (0, 1, 0) at rest, the
 * base the square [-0.1, 0.1]^2 on the floor, reach 0.5, margin 0.1, step 0.4
 * s; pushes along +x. Bounds: absorb m w0 0.1, step m w0 (0.1 + d* exp(-0.4
 * w0)).
 *
 * Scenarios:
 *
 * 1. The bounds equal those closed forms within 1e-9; no push absorbs with
 *    infinite bounds.
 * 2. A push of 0.9 x absorb is absorbed; its velocity is J / m and its angular
 *    momentum about the centre, applied at (0, 1.5, 0), is (0, 0, -0.5 J).
 * 3. A push of 1.1 x absorb takes one step, at x = 0.1 + 0.01 exp(0.4 w0).
 * 4. A push of twice the step bound falls with no steps.
 * 5. Zero mass and an empty support are refused.
 */
export function test_engine_kinematics_balance_outcome(): void {
  const w0: number = Math.sqrt(AutoMovieEngineGravity.STANDARD);
  const support: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];
  const props = (j: number): IAutoMovieResolveBalanceOutcome.IProps => ({
    mass: 70,
    length: 1,
    reach: 0.5,
    margin: 0.1,
    step: 0.4,
    centre: { x: 0, y: 1, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    impulse: { x: j, y: 0, z: 0 },
    at: { x: 0, y: 1.5, z: 0 },
    support,
  });
  const a: number = Math.exp(w0 * 0.4);
  const absorb: number = 70 * w0 * 0.1;
  const stepBound: number =
    70 * w0 * (0.1 + ((0.6 * a) / (a - 1)) * Math.exp(-w0 * 0.4));

  // 1.
  const bounds = AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome(props(1)).bounds;
  TestValidator.predicate(
    "bounds",
    Math.abs(bounds.absorb - absorb) <= 1e-9 &&
      Math.abs(bounds.step - stepBound) <= 1e-9,
  );
  const still = AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome(props(0));
  TestValidator.equals(
    "still",
    [still.outcome, still.bounds.absorb, still.bounds.step],
    ["absorb", Infinity, Infinity],
  );

  // 2.
  const j: number = 0.9 * absorb;
  const absorbed = AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome(props(j));
  TestValidator.equals(
    "absorbed",
    [absorbed.outcome, absorbed.steps],
    ["absorb", []],
  );
  TestValidator.predicate(
    "momentum",
    Math.abs(absorbed.velocity.x - j / 70) <= 1e-15 &&
      Math.abs(absorbed.angular.z + 0.5 * j) <= 1e-12 &&
      absorbed.angular.x === 0,
  );

  // 3.
  const stepped = AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome(props(1.1 * absorb));
  TestValidator.predicate(
    "one step",
    stepped.outcome === "step" &&
      stepped.steps.length === 1 &&
      Math.abs(stepped.steps[0]!.x - (0.1 + 0.01 * a)) <= 1e-12,
  );

  // 4.
  TestValidator.equals(
    "fall",
    [
      AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome(props(2 * stepBound)).outcome,
      AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome(props(2 * stepBound)).steps,
    ],
    ["fall", []],
  );

  // 5.
  TestValidator.predicate(
    "mass",
    throwsError(
      (): unknown => AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome({ ...props(1), mass: 0 }),
      "positive mass",
    ),
  );
  TestValidator.predicate(
    "support",
    throwsError(
      (): unknown =>
        AutoMovieEngineKinematics.resolveAutoMovieBalanceOutcome({ ...props(1), support: [] }),
      "support point",
    ),
  );
}
