import {
  HumanArmGeometry,
  HumanArmTrajectoryKnots,
  HumanArmTrajectoryRangeExcess,
  HumanArmTrajectoryRateProjection,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Dividing the model's tolerance by the ROM resolution and multiplying one
 * range excess can round twice at the largest checked scale of 5,000.
 */
const ROUNDING: number = 2 * 5_000 * Number.EPSILON;

/**
 * The arm planner's range primitives: what passes a joint's range, read at
 * every frame (`HumanArmTrajectoryRangeExcess`), and the knots' rates held on a
 * bound (`HumanArmTrajectoryRateProjection`), so the course between knots keeps
 * the ranges the knots are held to.
 *
 * One arm, three coordinates: the shoulder chart's two, unbounded but held to
 * its disc of `SCALE` (the rest and the return at its centre), and a third
 * boxed to `[-10, 10]`. The excess is weighted by `RANGE`, 100: a degree past
 * is a hundred of the solver's millimetres.
 *
 * Scenarios:
 *
 * 1. Inside every range the excess is negative; 12 on the box is 200; the chart
 *    swung to 1.5 `SCALE` is `50 SCALE`.
 * 2. Three knots of one bounded coordinate, the middle on its upper bound with
 *    velocity 2 and acceleration 3: both are outward, so the knot is held
 *    still; with acceleration −3 (turning back inward) that is kept. The ends,
 *    which no solve moves, are left as given.
 * 3. At an interior position 9 on a [0, 10] box, the outgoing second control is 13
 *    before projection. Scale its derivative by 1/4 to put that control at 10.
 *    The same derivative serves the incoming interval.
 * 4. At 3/5 of the swing radius, a perpendicular second control can move 4/5 of
 *    that radius before reaching the circle.
 */
export function test_unit_motions_posture_arm_trajectory_ranges(): void {
  const scale: number = HumanArmGeometry.SCALE;
  const c: Parameters<typeof HumanArmTrajectoryRangeExcess>[0] = {
    free: [[0, 1, 2]],
    bounds: [[null, null, [-10, 10]]],
  };
  TestValidator.predicate(
    "the excess",
    HumanArmTrajectoryRangeExcess(c, 0, [0, 0, 5], scale) < 0 &&
      nclose(
        HumanArmTrajectoryRangeExcess(c, 0, [0, 0, 12], scale),
        200,
        ROUNDING,
      ) &&
      nclose(
        HumanArmTrajectoryRangeExcess(c, 0, [1.5 * scale, 0, 0], scale),
        50 * scale,
        ROUNDING,
      ),
  );

  const knots: Parameters<typeof HumanArmTrajectoryRateProjection>[0] = {
    n: 3,
    open: false,
    times: [0, 1, 2],
    free: [[0]],
    bounds: [[[-1, 1]]],
    rest: [[0]],
    back: [[0]],
  };
  const x: number[][][] = [[[0], [1], [0]]];
  const out: HumanArmTrajectoryKnots.IRates = HumanArmTrajectoryRateProjection(
    knots,
    x,
    {
      velocities: [[[5], [2], [5]]],
      accelerations: [[[5], [3], [5]]],
    },
  );
  const back: HumanArmTrajectoryKnots.IRates = HumanArmTrajectoryRateProjection(
    knots,
    x,
    {
      velocities: [[[5], [2], [5]]],
      accelerations: [[[5], [-3], [5]]],
    },
  );
  TestValidator.equals(
    "a knot on its bound is held",
    [out.velocities, out.accelerations, back.accelerations],
    [[[[5], [0], [5]]], [[[5], [0], [5]]], [[[5], [-3], [5]]]],
  );

  const zero: number[] = [0, 0, 0];
  const interior: Parameters<typeof HumanArmTrajectoryRateProjection>[0] = {
    ...knots,
    free: [[0, 1, 2]],
    bounds: [[null, null, [0, 10]]],
    rest: [zero],
    back: [zero],
  };
  const points: number[][][] = [[zero, [(3 * scale) / 5, 0, 9], zero]];
  const raw: HumanArmTrajectoryKnots.IRates = {
    velocities: [[zero, [0, (5 * scale) / 2, 10], zero]],
    accelerations: [[zero, zero, zero]],
  };
  const fit: HumanArmTrajectoryKnots.IRates = HumanArmTrajectoryRateProjection(
    interior,
    points,
    raw,
  );
  TestValidator.equals(
    "both control limits preserve the shared feasible rates",
    fit.velocities[0]![1],
    [0, 2 * scale, 2.5],
  );
  const point = (rates: HumanArmTrajectoryKnots.IRates): number =>
    HumanArmTrajectoryKnots.positions(
      interior.times,
      points[0]!,
      rates.velocities[0]!,
      rates.accelerations[0]!,
    )(1.2).coordinates[2]!;
  TestValidator.predicate(
    "the between-knot curve stays within its box",
    point(raw) > 10 && point(fit) < 10,
  );
}
