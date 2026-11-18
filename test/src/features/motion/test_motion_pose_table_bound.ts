import { createDrinkware } from "@automovie/archetypes";
import { AutoMovieComposition } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanStrike,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A displayed pose read from its action's pose table lies within the
 * audits' tightest bound of the pose the display pipeline solves exactly:
 * every bone within the floor, slip, lift and jump limits
 * (`AutoMovieMotionHumanAudit.LIMITS`, 5 mm) of its exact place, whatever
 * shapes the displayed pose (planted and swinging feet, a held prop carried
 * under an overlay, a strike's stop and its partner's reaction).
 *
 * Scenarios, each read at every 1/97 s (a step no action's keys share, so
 * nearly every read falls between knots), forward and again in reverse on a
 * fresh performance, since a table's knots must not depend on the order
 * seconds are read:
 * 1. A stand of 0.4 s, a walk 1.5 m ahead and a stand of 0.4 s on the
 *    average man.
 * 2. A glass picked up from waist height and carried through a 2 m walk with
 *    a sip from it over the walk: a hold, a carry and an overlay that takes
 *    the hand over.
 * 3. A registered cross to a partner's chin while the partner flinches: the
 *    striker's weapon stops at the hit and the partner's reaction is synced
 *    to it; both people are read.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public displayed pose (table) and the public exact pose of the same performance and compares every bone's world place.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the audits' own limit, read from the audit module, and the exact pose is the display pipeline's own solve.
 * @evidence contracts/development/testing.md#distinguishing-cases Plain locomotion, a held prop with a carry and an overlay, a stopped strike with a synced reaction; forward and reverse read orders.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the canonical average man and one archetype; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the bound, the read grid, the read orders and the 3 scenarios.
 */
export function test_motion_pose_table_bound(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const limits = AutoMovieMotionHumanAudit.LIMITS;
  const bound: number = Math.min(limits.floor, limits.slip, limits.lift, limits.jump);
  const reach: number = body.measure.upperArm + body.measure.forearm;
  const performer = (subject: string, z: number, yaw: number) => ({
    subject, body, at: { x: 0, y: 0, z }, yaw, proficiency: { level: "trained" as const },
  });
  const scenarios: [string, readonly string[], () => HumanPerformance][] = [
    ["stand, walk, stand", ["a"], (): HumanPerformance => new HumanPerformance({
      seed: "pose-table-bound",
      performers: [performer("a", 0, 0)],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.4 })
        .walk({ to: { x: 0, y: 0, z: 1.5 } })
        .stand({ seconds: 0.4 }).node,
    })],
    ["held glass, walk, sip over it", ["a"], (): HumanPerformance => new HumanPerformance({
      seed: "pose-table-bound-held",
      props: [
        HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
          at: { x: -body.measure.shoulderHalfWidth, y: body.measure.waistHeight, z: 0.6 * reach },
          yaw: 0,
        }),
      ],
      performers: [performer("a", 0, 0)],
      composition: HumanChain.subject("a")
        .pickUp({ prop: "glass", handle: "body", use: { tip: "lip", line: "square", at: "mouth" } })
        .walk({ to: { x: 0, y: 0, z: 2 } })
        .over((u: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
          u.handToFace({ task: "sip", prop: "glass" })).node,
    })],
    ["cross to a flinching partner", ["a", "b"], (): HumanPerformance => new HumanPerformance({
      seed: "pose-table-bound-hit",
      laws: [HumanStrike.cross],
      performers: [performer("a", 0, 0), performer("b", reach + 0.25, 180)],
      composition: AutoMovieComposition.parallel(
        HumanChain.subject("a").registered("cross", { at: { kind: "person", subject: "b", region: "chin" } }, "strike").node,
        HumanChain.subject("b").stand({ seconds: 0.2 }).flinch({}).sync({ hit: { on: "b", by: "a" } }).node,
      ),
    })],
  ];
  for (const [label, subjects, make] of scenarios)
    for (const reverse of [false, true]) {
      const performance: HumanPerformance = make();
      const seconds: number[] = [];
      for (let k: number = 0; k / 97 <= performance.duration; ++k) seconds.push(k / 97);
      if (reverse) seconds.reverse();
      for (const subject of subjects) {
        let worst: { distance: number; at: number; bone: string } = { distance: 0, at: 0, bone: "" };
        for (const at of seconds) {
          const tabled: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, performance.pose(subject, at));
          const exact: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, performance.exact(subject, at));
          for (const [bone, placed] of exact) {
            const p = placed.worldPosition;
            const q = tabled.get(bone)?.worldPosition;
            const distance: number = q === undefined ? Infinity : Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
            if (distance > worst.distance) worst = { distance, at, bone };
          }
        }
        TestValidator.predicate(
          `${label}, ${subject}, ${reverse ? "reverse" : "forward"} reads: every table bone within ${bound * 1000} mm of the exact pose (worst ${(worst.distance * 1000).toFixed(3)} mm, ${worst.bone} at ${worst.at.toFixed(4)} s)`,
          worst.distance <= bound,
        );
      }
    }
}
