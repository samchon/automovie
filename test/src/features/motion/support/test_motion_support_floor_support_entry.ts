import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  AutoMovieMotionHumanFloor,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * Floor entry transfers the feet's support to the ground.
 *
 * Scenarios:
 *
 * - During a tuck the feet stay planted, the head passes below the hips, and the
 *   turning body stays near the ground as it travels in the chosen direction.
 * - A side dive clears both feet while preserving the chest axis. A slide travels
 *   forward. Both finish with low hips and declared seat support, and each take
 *   passes the shipped verdicts (the feet leave the floor plantarflexed within
 *   an unloaded ankle's range).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Samples displayed world joints, chest rotation and the actual ground contact through the public floor laws.
 * @evidence contracts/development/testing.md#independent-expectations Uses the original geometric campaign bounds of 5 mm plant slip, 50 mm foot clearance, 20 degrees chest rotation, 150 mm lowest joint and 400 mm hip height. Directed travel is at least 400 mm rolling or 600 mm falling.
 * @evidence contracts/development/testing.md#distinguishing-cases Forward/backward rotation, left/right flight and forward sliding are distinct directed outputs. All use one initial stance.
 * @evidence contracts/development/testing.md#execution-ownership One real plan per distinct floor-entry direction on a single prepared body.
 * @evidence contracts/development/common.md#meaningful-documentation Bounds are distances and angles of the displayed body.
 */
export function test_motion_support_floor_support_entry(): void {
  const findings = motionComplaints();
  const body = motionHumanBody("f-small");
  const laws = [
    AutoMovieMotionHumanFloor.HumanFloorRoll.forwardRoll,
    AutoMovieMotionHumanFloor.HumanFloorRoll.backwardRoll,
    AutoMovieMotionHumanFall.HumanFloorFall.goalkeeperDiveLeft,
    AutoMovieMotionHumanFall.HumanFloorFall.goalkeeperDiveRight,
    AutoMovieMotionHumanFall.HumanFloorFall.slidingTackle,
  ];
  for (const law of laws) {
    const label = law.name;
    try {
      const p = new HumanPerformance({
        seed: "floor-support",
        laws: [law],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.3 })
          .registered(label, {}).node,
      });
      const segment = p.segments("a")[1]!;
      const joint = (
        bone: AutoMovieHumanoidBone,
        seconds: number,
      ): IAutoMovieVector3 => p.bones("a", seconds).get(bone)!.worldPosition;
      const event = (name: string): number => {
        const e = segment.plan.events.find((e) => e.name === name);
        if (!e) throw new Error(`Missing ${name}`);
        return segment.start + segment.plan.duration * e.share;
      };
      const low = (t: number): number =>
        Math.min(
          ...Array.from(p.bones("a", t).values(), (b) => b.worldPosition.y),
        );
      const through = (
        from: number,
        to: number,
        check: (t: number) => boolean,
      ): boolean => {
        for (let t = from; t < to; t += 1 / 24) if (!check(t)) return false;
        return check(to);
      };
      const end = segment.end;
      const start = segment.start;
      const hips = joint("hips", end);
      const shift = Vector3.subtract(hips, joint("hips", start));
      if (label === "forwardRoll" || label === "backwardRoll") {
        const sign = label === "forwardRoll" ? 1 : -1;
        const over = event("over");
        findings.check(
          label + " inverts and travels",
          joint("head", over).y < joint("hips", over).y &&
            sign * shift.z >= 0.4,
        );
        findings.check(
          label + " remains grounded",
          through(event("tucked"), event("rolled"), (t) => low(t) <= 0.15),
        );
        for (const foot of ["leftFoot", "rightFoot"] as const) {
          const first = joint(foot, start);
          findings.check(
            label + " crouch plants " + foot,
            through(
              start,
              event("tucked"),
              (t) =>
                Vector3.length(Vector3.subtract(joint(foot, t), first)) <=
                0.005,
            ),
          );
        }
        continue;
      }
      if (label === "slidingTackle")
        findings.check(label + " travels forward", shift.z >= 0.6);
      else {
        const sign = label === "goalkeeperDiveLeft" ? 1 : -1;
        findings.check(
          label + " travels head first",
          sign * shift.x >= 0.6 && sign * (joint("head", end).x - hips.x) > 0,
        );
        const from = event("takeOff"),
          to = event("landed");
        for (const foot of ["leftFoot", "rightFoot"] as const)
          findings.check(
            label + " clears " + foot,
            joint(foot, (from + to) / 2).y - joint(foot, start).y >= 0.05,
          );
        const facing = (t: number) =>
          Quaternion.rotateVector(p.bones("a", t).get("chest")!.worldRotation, {
            x: 0,
            y: 0,
            z: 1,
          });
        const first = facing(from);
        findings.check(
          label + " preserves chest heading",
          through(
            from,
            to,
            (t) =>
              Vector3.dot(first, facing(t)) >= Math.cos((20 * Math.PI) / 180),
          ),
        );
      }
      findings.check(label + " lands low", hips.y <= 0.4 && low(end) <= 0.15);
      // The take passes the verdicts: among them, a foot that leaves the
      // floor at take-off is plantarflexed within an unloaded ankle's range.
      assertTakeClean(label, p);
      findings.check(
        label + " declares seat support at landing",
        segment.plan.contacts.some(
          (c) => c.part === "seat" && c.support.kind === "ground" && c.to >= 1,
        ),
      );
    } catch (error) {
      findings.list.push(label + ": " + String(error));
    }
  }
  for (const position of [
    "supine",
    "prone",
    "lateralLeft",
    "lateralRight",
  ] as const) {
    const rightOrFront = position === "prone" || position === "lateralRight";
    const performer = {
      subject: "a",
      body: rightOrFront ? motionHumanBody("m-large") : body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    };
    const lying = new HumanPerformance({
      seed: "sweep-1",
      performers: [performer],
      composition: HumanChain.subject("a").lieDown(
        position === "supine" ? {} : { kind: position },
      ).node,
    });
    const segment = lying.segments("a")[0]!;
    const settled = segment.plan.events.find((e) => e.name === "settled");
    if (!settled) {
      findings.list.push(position + " lacks settled event");
      continue;
    }
    const time =
      (segment.start + settled.share * segment.plan.duration + segment.end) / 2;
    const bones = lying.bones("a", time);
    const left = bones.get("leftUpperArm")!.worldPosition,
      right = bones.get("rightUpperArm")!.worldPosition;
    const lateral = Vector3.normalize(Vector3.subtract(left, right));
    const along = Vector3.normalize(
      Vector3.subtract(
        Vector3.lerp(left, right, 0.5),
        bones.get("hips")!.worldPosition,
      ),
    );
    const front = Vector3.normalize(Vector3.cross(lateral, along));
    const side = position === "lateralLeft" || position === "lateralRight";
    const vertical = side
      ? position === "lateralLeft"
        ? -lateral.y
        : lateral.y
      : position === "prone"
        ? -front.y
        : front.y;
    findings.check(
      position + " faces its bearing side",
      vertical >
        Math.max(Math.abs(along.y), Math.abs(side ? front.y : lateral.y)),
    );
    findings.check(
      position + " declares a lying base",
      segment.plan.base?.kind === "lying",
    );
    const verdict = HumanVerdicts(lying);
    if (!verdict.clean)
      findings.list.push(position + ": " + HumanVerdicts.describe(verdict));
  }
  findings.assert("floor support transfers");
}
