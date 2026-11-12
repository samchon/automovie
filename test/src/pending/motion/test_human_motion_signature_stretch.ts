import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { motionComplaints } from "../../features/internal/motionComplaints";
import { motionHumanBody } from "../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../features/internal/motionHumanLaw";
import { motionHumanSignature as M } from "../../features/internal/motionHumanSignature";

/**
 * A standing static stretch looks like one, on the four extreme bodies for
 * each pose at its own default hold, read at the middle of the hold
 * (`reachEnd` to `release`).
 *
 * Bounds and sources:
 * - Hold: a static stretch is held 10 to 30 s (ACSM's Guidelines for
 *   Exercise Testing and Prescription, 11th ed.), 30 s being as effective
 *   as longer holds (Bandy, Irion and Briggler 1997, Phys Ther 77:1090).
 *   Bound: `reachEnd` to `release` in [10, 30] s.
 * - The stretched joint reaches its stretch: a stretch takes a joint toward
 *   the end of its range, not a token of it. Bounds (provisional, about the
 *   normal ranges): the neck side bend tilts the head at least 20 degrees
 *   to the side from the trunk (neck lateral flexion ranges about 45); the
 *   quadriceps stretch folds the knee at least 130 degrees (heel near the
 *   buttock); the cross-body stretch carries the stretched hand past the
 *   other shoulder joint; the overhead side bend tilts the trunk at least 10
 *   degrees to the side; the tree pose lifts the raised foot at least 0.1 m
 *   off the floor with its knee at least 0.15 m out from its hip.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real stretch law on real bodies at its own hold and reads displayed joints; a hold outside the recommendation or a pose that barely moves the joint it names fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The hold is ACSM's and Bandy et al.'s; each pose's reach is marked provisional about the joint's normal range.
 * @evidence contracts/development/testing.md#distinguishing-cases Five poses on four bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_stretch(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of motionHumanBody.EXTREMES)
    for (const kind of [
      "neckSide",
      "quadriceps",
      "crossBody",
      "overheadSide",
      "tree",
    ]) {
      const cell: string = `stretch kind=${kind} ${name}`;
      const body = motionHumanBody(name);
      const film = motionHumanLaw.perform(
        "signature",
        [{ subject: "a", body }],
        HumanChain.subject("a").act("stretch", { kind } as never),
      );
      const s: M.IStaged = { film, body, yaw: 0 };
      const reach: number = M.event(s, "reachEnd")!;
      const release: number = M.event(s, "release")!;
      complaints.check(
        `${cell}: held ${(release - reach).toFixed(1)} s, [10, 30] expected (ACSM 11th ed.; Bandy et al. 1997)`,
        release - reach >= 10 && release - reach <= 30 + 1e-6,
      );
      const t: number = (reach + release) / 2;
      const left: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
      const side = (v: IAutoMovieVector3): number =>
        (Math.atan2(v.x * left.x + v.z * left.z, v.y) * 180) / Math.PI;
      const mid = (a: IAutoMovieVector3, b: IAutoMovieVector3) => ({
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        z: (a.z + b.z) / 2,
      });
      const shoulders = mid(
        M.joint(s, t, "leftUpperArm"),
        M.joint(s, t, "rightUpperArm"),
      );
      const hips = mid(
        M.joint(s, t, "leftUpperLeg"),
        M.joint(s, t, "rightUpperLeg"),
      );
      const trunkSide: number = side({
        x: shoulders.x - hips.x,
        y: shoulders.y - hips.y,
        z: shoulders.z - hips.z,
      });
      if (kind === "neckSide") {
        const up = Quaternion.rotateVector(
          M.bones(s, t).get("head")!.worldRotation,
          { x: 0, y: 1, z: 0 },
        );
        const tilt: number = Math.abs(side(up) - trunkSide);
        complaints.check(
          `${cell}: the head is tilted ${tilt.toFixed(1)} deg to the side of the trunk mid-hold, at least 20 expected (provisional)`,
          tilt >= 20,
        );
      } else if (kind === "quadriceps") {
        const knee: number = Math.max(
          M.knee(s, t, "left"),
          M.knee(s, t, "right"),
        );
        complaints.check(
          `${cell}: the stretched knee is folded ${knee.toFixed(1)} deg mid-hold, at least 130 expected (provisional)`,
          knee >= 130,
        );
      } else if (kind === "crossBody") {
        const l = M.joint(s, t, "leftHand");
        const r = M.joint(s, t, "rightHand");
        const ls = M.joint(s, t, "leftUpperArm");
        const rs = M.joint(s, t, "rightUpperArm");
        const crossed: boolean = r.x > ls.x || l.x < rs.x;
        complaints.check(
          `${cell}: mid-hold neither hand is past the other shoulder joint (left hand x ${l.x.toFixed(3)} vs right shoulder ${rs.x.toFixed(3)}, right hand ${r.x.toFixed(3)} vs left shoulder ${ls.x.toFixed(3)}); the stretched hand past it expected (provisional)`,
          crossed,
        );
      } else if (kind === "overheadSide")
        complaints.check(
          `${cell}: the trunk is tilted ${Math.abs(trunkSide).toFixed(1)} deg to the side mid-hold, at least 10 expected (provisional)`,
          Math.abs(trunkSide) >= 10,
        );
      else {
        const raised: "left" | "right" =
          M.sole(s, t, "left").y > M.sole(s, t, "right").y ? "left" : "right";
        const lift: number = M.sole(s, t, raised).y;
        const knee = M.joint(s, t, `${raised}LowerLeg`);
        const hip = M.joint(s, t, `${raised}UpperLeg`);
        const out: number = Math.abs(knee.x - hip.x);
        complaints.check(
          `${cell}: the raised foot (${raised}) is ${(lift * 1000).toFixed(0)} mm off the floor with its knee ${(out * 1000).toFixed(0)} mm out from its hip, at least 100 and 150 expected (provisional)`,
          lift >= 0.1 && out >= 0.15,
        );
      }
    }
  complaints.assert("every stretch is held as a static stretch is");
}
