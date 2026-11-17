import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  HumanChain,
  HumanPerformance,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A displayed pose read from its action's pose table lies within the
 * audits' tightest bound of the pose the display pipeline solves exactly:
 * every bone within the floor, slip, lift and jump limits
 * (`AutoMovieMotionHumanAudit.LIMITS`, 5 mm) of its exact place.
 *
 * Scenarios:
 * 1. A stand of 0.4 s, a walk 1.5 m ahead and a stand of 0.4 s on the
 *    average man, read at every 1/97 s (a step no action's keys share, so
 *    nearly every read falls between knots): the table's bones and the
 *    exact pose's lie within the bound at every second read.
 * 2. Read again in reverse order on a fresh performance, the same bound
 *    holds: a table's knots do not depend on the order seconds are read.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public displayed pose (table) and the public exact pose of the same performance and compares every bone's world place.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the audits' own limit, read from the audit module, and the exact pose is the display pipeline's own solve.
 * @evidence contracts/development/testing.md#distinguishing-cases A stand and a walk (still and moving legs, planted and swinging feet), forward and reverse read orders.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on the canonical average man; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the bound, the performance, the read grid and the 2 scenarios.
 */
export function test_motion_pose_table_bound(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const limits = AutoMovieMotionHumanAudit.LIMITS;
  const bound: number = Math.min(limits.floor, limits.slip, limits.lift, limits.jump);
  const make = (): HumanPerformance =>
    new HumanPerformance({
      seed: "pose-table-bound",
      performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.4 })
        .walk({ to: { x: 0, y: 0, z: 1.5 } })
        .stand({ seconds: 0.4 }).node,
    });
  for (const reverse of [false, true]) {
    const performance: HumanPerformance = make();
    const seconds: number[] = [];
    for (let k: number = 0; k / 97 <= performance.duration; ++k) seconds.push(k / 97);
    if (reverse) seconds.reverse();
    let worst: { distance: number; at: number; bone: string } = { distance: 0, at: 0, bone: "" };
    for (const at of seconds) {
      const tabled: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, performance.pose("a", at));
      const exact: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, performance.exact("a", at));
      for (const [bone, placed] of exact) {
        const other: IAutoMovieResolvedBone | undefined = tabled.get(bone);
        const p = placed.worldPosition;
        const q = other?.worldPosition;
        const distance: number = q === undefined ? Infinity : Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
        if (distance > worst.distance) worst = { distance, at, bone };
      }
    }
    TestValidator.predicate(
      `${reverse ? "reverse" : "forward"} reads: every table bone within ${bound * 1000} mm of the exact pose (worst ${(worst.distance * 1000).toFixed(3)} mm, ${worst.bone} at ${worst.at.toFixed(4)} s)`,
      worst.distance <= bound + 1e-9,
    );
  }
}
