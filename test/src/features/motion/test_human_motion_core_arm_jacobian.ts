import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmJacobian,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanArmJacobian,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The arm planner's Jacobian is the derivative of its own forward
 * kinematics, which clamps every joint to the skeleton's range.
 *
 * Scenarios:
 * 1. Over 30 seeded arms of the average man within their ranges, both
 *    sides, every free coordinate's column (each segment's world
 *    turn and the elbow's and the wrist's velocity) matches a central
 *    difference of the planner's chain within 1e-6 of its size.
 * 2. With the elbow's flexion and then the wrist's abduction set 200
 *    degrees past their ranges, forward kinematics holds the arm at the
 *    limit, so a central difference there is zero, and so is the column.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public Jacobian and the chain it differentiates; a turn read in a segment's own frame, a missing lever arm, a wrong axis or a column that moves an arm the clamp holds fails.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is a central difference of the forward kinematics written here, never the Jacobian's arithmetic.
 * @evidence contracts/development/testing.md#distinguishing-cases Both arms, the shoulder's chart coordinates, the elbow's and the wrist's angles, inside their ranges and past them.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the 2 scenarios and their bounds.
 */
export function test_human_motion_core_arm_jacobian(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const pose: IAutoMoviePose = resolveHumanPosture(
    body,
    stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
  );
  let seed: number = 20261115;
  const random = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const length = (v: IAutoMovieVector3): number => Math.hypot(v.x, v.y, v.z);
  const minus = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  });
  const scale = (a: IAutoMovieVector3, s: number): IAutoMovieVector3 => ({
    x: a.x * s,
    y: a.y * s,
    z: a.z * s,
  });
  // The world turn carrying one rotation to another, radians.
  const turn = (
    from: IAutoMovieQuaternion,
    to: IAutoMovieQuaternion,
  ): IAutoMovieVector3 => {
    let q: IAutoMovieQuaternion = Quaternion.multiply(
      to,
      Quaternion.inverse(from),
    );
    if (q.w < 0) q = { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
    const s: number = Math.hypot(q.x, q.y, q.z);
    if (s < 1e-15) return { x: 0, y: 0, z: 0 };
    const angle: number = 2 * Math.atan2(s, q.w);
    return scale({ x: q.x, y: q.y, z: q.z }, angle / s);
  };
  const H: number = 1e-5;
  // Each column against a central difference: the worst relative miss.
  const miss = (read: ReturnType<typeof HumanArmJacobian.read>): number => {
    let worst: number = 0;
    read.columns.forEach(
      (column: IAutoMovieMotionHumanArmJacobian.IColumn, i: number): void => {
        const d: number = read.free[i]!;
        const up: number[] = [...read.c];
        const down: number[] = [...read.c];
        up[d] = up[d]! + H;
        down[d] = down[d]! - H;
        const a: IAutoMovieMotionHumanArmJacobian.IChain = read.chain(down);
        const b: IAutoMovieMotionHumanArmJacobian.IChain = read.chain(up);
        for (const [analytic, numeric] of [
          [column.upper.angular, scale(turn(a.upper, b.upper), 1 / (2 * H))],
          [column.lower.angular, scale(turn(a.lower, b.lower), 1 / (2 * H))],
          [column.hand.angular, scale(turn(a.hand, b.hand), 1 / (2 * H))],
          [column.lower.linear, scale(minus(b.elbow, a.elbow), 1 / (2 * H))],
          [column.hand.linear, scale(minus(b.wrist, a.wrist), 1 / (2 * H))],
        ] as const)
          worst = Math.max(
            worst,
            length(minus(analytic, numeric)) / (1e-3 + length(numeric)),
          );
      },
    );
    return worst;
  };

  // 1. Arms within their ranges.
  let inside: number = 0;
  for (let i: number = 0; i < 30; i++) {
    const side: "left" | "right" = i % 2 === 0 ? "right" : "left";
    inside = Math.max(
      inside,
      miss(
        HumanArmJacobian.read(body, side, pose, {
          upper: [20 + 60 * random(), 10 + 30 * random(), -20 + 40 * random()],
          lower: [10 + 80 * random(), 0, -40 + 80 * random()],
          hand: [-30 + 60 * random(), -10 + 20 * random(), 0],
        }),
      ),
    );
  }
  TestValidator.predicate(
    `columns match the chain's differences (${inside})`,
    inside <= 1e-6,
  );

  // 2. Past a range the clamp holds the arm, and the column is zero.
  const arm = {
    upper: [40, 20, 0] as [number, number, number],
    lower: [50, 0, 0] as [number, number, number],
    hand: [10, 0, 0] as [number, number, number],
  };
  const zero = (offset: number[], d: number): boolean => {
    const read = HumanArmJacobian.read(body, "right", pose, arm, offset);
    const column: IAutoMovieMotionHumanArmJacobian.IColumn =
      read.columns[read.free.indexOf(d)]!;
    const moved: number = [column.upper, column.lower, column.hand].reduce(
      (s: number, t): number => s + length(t.angular) + length(t.linear),
      0,
    );
    return moved === 0 && miss(read) <= 1e-6;
  };
  TestValidator.predicate(
    "an elbow and a wrist past their ranges move nothing",
    zero([0, 0, 0, -200, 0, 0, 0, 0, 0], 3) &&
      zero([0, 0, 0, 0, 0, 0, 0, -200, 0], 7),
  );
}
