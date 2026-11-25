import { HumanArmTrajectoryKnots } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
 */
export function test_unit_motions_posture_arm_knot_quintic(): void {
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
          nclose(p[d]!, X[0]![k]![d]!, 1e-9) &&
          nclose(v[d]!, rates.velocities[0]![k]![d]!, 1e-6) &&
          nclose(a[d]!, rates.accelerations[0]![k]![d]!, 1e-6),
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
          1e-9,
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
}
