import {
  HumanArmSeed
} from "../../../../../packages/motions/src/posture/internal/HumanArmSeed";
import {
  HumanArmTrajectoryStep
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryStep";
import { TestValidator } from "@nestia/e2e";

/**
 * The SQP's position step keeps the entry and exit, keeps each committed hold,
 * and moves only free coordinates of the remaining knots.
 *
 * Scenarios:
 *
 * 1. Both endpoints stay at zero. The first inner knot stays at its supplied hold,
 *    even with a nonzero numerical step. The other arm has no site there and
 *    still moves.
 * 2. The free knot moves to the projected point. Raising coordinate 3 by 30
 *    degrees from zero caps it at its 20-degree box bound. Coordinate 2 stays
 *    fixed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines which arm coordinates may move in a numerical step and which fixed or held knots retain identity.
 * @evidence contracts/development/testing.md#behavioral-verification Applies a nonzero step to a two-arm trajectory with pinned ends, a committed one-arm hold and a free knot.
 * @evidence contracts/development/testing.md#independent-expectations The fixture's fixed positions and coordinate lock give unchanged values, while a 30° requested move clamps to the free coordinate's 20° bound.
 */
export function test_motions_posture_arm_trajectory_step(): void {
  const zero: number[] = [0, 0, 0, 0];
  const hold: number[] = [0, 0, 0, 8];
  const pin: HumanArmSeed.IHolds = new Map<number, number[][]>([
    [1, [hold, zero]],
  ]);
  const c: Parameters<typeof HumanArmTrajectoryStep>[0] = {
    n: 4,
    open: false,
    times: [0, 1, 2, 3],
    sites: [
      [
        undefined,
        {
          point: { x: 0, y: 0, z: 0 },
          contact: { x: 0, y: 0, z: 0 },
          disc: 0,
        },
      ],
      [],
    ],
    rest: [zero, zero],
    back: [zero, zero],
    free: [[0, 1, 3], [3]],
    bounds: [
      [null, null, null, [0, 20]],
      [null, null, null, [0, 20]],
    ],
    offset: [0, 3],
    width: 4,
  };
  const stepped: number[][][] = HumanArmTrajectoryStep(
    c,
    [
      [zero, zero, zero, zero],
      [zero, zero, zero, zero],
    ],
    Float64Array.of(1, 2, 3, 6, 4, 5, 30, 0),
    pin,
  );
  TestValidator.equals("fixed anchors and the projected free step", stepped, [
    [zero, hold, [4, 5, 0, 20], zero],
    [zero, [0, 0, 0, 6], zero, zero],
  ]);
}
