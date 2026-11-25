import {
  HumanArmSeed,
  HumanArmTrajectoryStep,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The SQP's position step keeps the entry and exit, keeps each committed
 * hold, and moves only free coordinates of the remaining knots.
 *
 * Scenarios:
 *
 * 1. Both endpoints stay at zero. The first inner knot stays at its supplied
 *    hold, even with a nonzero numerical step.
 * 2. The free knot moves to the projected point. Raising coordinate 3 by
 *    30 degrees from zero caps it at its 20-degree box bound. Coordinate 2
 *    stays fixed.
 */
export function test_unit_motions_posture_arm_trajectory_step(): void {
  const zero: number[] = [0, 0, 0, 0];
  const hold: number[] = [0, 0, 0, 8];
  const pin: HumanArmSeed.IHolds = new Map<number, number[][]>([[1, [hold]]]);
  const c: Parameters<typeof HumanArmTrajectoryStep>[0] = {
    n: 4,
    open: false,
    times: [0, 1, 2, 3],
    rest: [zero],
    back: [zero],
    free: [[0, 1, 3]],
    bounds: [[null, null, null, [0, 20]]],
    offset: [0],
    width: 3,
  };
  const stepped: number[][][] = HumanArmTrajectoryStep(
    c,
    [[zero, zero, zero, zero]],
    Float64Array.of(1, 2, 3, 4, 5, 30),
    pin,
  );
  TestValidator.equals(
    "fixed anchors and the projected free step",
    stepped,
    [[zero, hold, [4, 5, 0, 20], zero]],
  );
}
