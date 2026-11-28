import {
  HumanArmTrajectoryKnots
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryKnots";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A six-term basis evaluated on inputs below 50 in scale, with polynomial
 * coefficient magnitude below 200 and a derivative rescaling of at most
 * sixteen on the shortest segment. Thirty-two rounded operations bound the
 * position and derivative comparisons at that scale.
 */
const ROUNDING: number = 32 * 50 * 200 * 16 * Number.EPSILON;

/** Four knots and a 1/30 s frame grid over their span. */
const KNOTS: readonly number[] = [0, 0.3, 0.55, 1];
const GRID: readonly number[] = Array.from(
  { length: 31 },
  (_: unknown, i: number): number => i / 30,
);

/** One arm, two coordinates, at each knot. */
const X: number[][][] = [
  [
    [0, 1],
    [3, 2],
    [5, -1],
    [6, 0],
  ],
];

/**
 * An arm trajectory's knots each carry a position, velocity and acceleration,
 * joined by the minimum-jerk quintic that meets both ends' three
 * (`HumanArmTrajectoryKnots`).
 *
 * Scenarios:
 *
 * 1. The course passes through every knot's position, velocity and acceleration
 *    exactly, so it is C2 at each interior knot.
 * 2. The weights reproduce the course exactly: every grid instant is the sum of
 *    its segment's six knot values times their weights, each velocity variable
 *    `span v` and acceleration `span² a`.
 * 3. A grid instant reads only its segment's two knots, so the subproblem on the
 *    knots stays banded.
 * 4. A two-second rest-to-rest unit move at its first quarter evaluates to
 *    0.103515625, 0.52734375 per second and 1.40625 per second squared.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines position, velocity and acceleration interpolation through each knot and two-knot basis support.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the same trajectory at knots and grid times and reconstructs grid values from its returned basis weights.
 * @evidence contracts/development/testing.md#independent-expectations An independent rest-to-rest quintic gives quarter-point position 0.103515625, velocity 0.52734375 and acceleration 1.40625 over two seconds.
 */
export function test_motions_posture_arm_knot_quintic(): void {
  const rates: HumanArmTrajectoryKnots.IRates = HumanArmTrajectoryKnots.rates(
    KNOTS,
    X,
  );
  TestValidator.predicate(
    "through each knot's three values",
    KNOTS.every((t: number, k: number): boolean => {
      const [p, v, a] = HumanArmTrajectoryKnots.at(
        KNOTS,
        X[0]!,
        rates.velocities[0]!,
        rates.accelerations[0]!,
        t,
      );
      return [0, 1].every(
        (d: number): boolean =>
          nclose(p[d]!, X[0]![k]![d]!, ROUNDING) &&
          nclose(v[d]!, rates.velocities[0]![k]![d]!, ROUNDING) &&
          nclose(a[d]!, rates.accelerations[0]![k]![d]!, ROUNDING),
      );
    }),
  );

  const weights: HumanArmTrajectoryKnots.IWeight[][] =
    HumanArmTrajectoryKnots.weights(KNOTS, GRID);
  const read: number[][] = HumanArmTrajectoryKnots.read(
    KNOTS,
    GRID,
    X,
    rates,
  )[0]!;
  const value = (w: HumanArmTrajectoryKnots.IWeight, d: number): number => {
    const s: number = HumanArmTrajectoryKnots.span(KNOTS, w.knot);
    return w.block === 0
      ? X[0]![w.knot]![d]!
      : w.block === 1
        ? s * rates.velocities[0]![w.knot]![d]!
        : s * s * rates.accelerations[0]![w.knot]![d]!;
  };
  TestValidator.predicate(
    "the weights reproduce the course",
    GRID.every((_: number, g: number): boolean =>
      [0, 1].every((d: number): boolean =>
        nclose(
          weights[g]!.reduce(
            (sum: number, w: HumanArmTrajectoryKnots.IWeight): number =>
              sum + w.weight * value(w, d),
            0,
          ),
          read[g]![d]!,
          ROUNDING,
        ),
      ),
    ),
  );
  TestValidator.predicate(
    "two knots an instant",
    weights.every((row: HumanArmTrajectoryKnots.IWeight[]): boolean => {
      const knots: number[] = row.map(
        (w: HumanArmTrajectoryKnots.IWeight): number => w.knot,
      );
      return Math.max(...knots) - Math.min(...knots) <= 1;
    }),
  );
  const [position, velocity, acceleration]: [number[], number[], number[]] =
    HumanArmTrajectoryKnots.at([0, 2], [[0], [1]], [[0], [0]], [[0], [0]], 0.5);
  TestValidator.predicate(
    "the closed-form minimum-jerk quarter point",
    nclose(position[0]!, 0.103515625, ROUNDING) &&
      nclose(velocity[0]!, 0.52734375, ROUNDING) &&
      nclose(acceleration[0]!, 1.40625, ROUNDING),
  );
}
