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
    free: [[0]],
    bounds: [[[-1, 1]]],
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
}
