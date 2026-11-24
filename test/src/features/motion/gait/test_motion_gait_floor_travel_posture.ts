import { Vector3, physicalShapeBounds } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
  HumanVerdicts,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanAudit,
  HumanColliders,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A heading is an angle, so a body facing 270 degrees is the body facing -90:
 * getting down onto the hands and knees from either shows the same motion, the
 * feet rolling onto their toes where they stood without turning about. A roll
 * that blends the foot's heading the long way round spins the foot almost a
 * whole turn on the way down when the yaw is written past 180.
 *
 * Scenarios: Knees and bear entry constrain the floor, planted pairs and knee
 * clearance. Inchworm hands progress before the plank and feet before the fold;
 * at most one limb is free. on the average man, crawling one cycle from
 * standing, read at 24 frames a second from the start to `down`:
 *
 * 1. Facing 270 and facing -90 the left and right toe and foot joints stand within
 *    a millimetre of each other at every frame.
 * 2. Facing 90 and facing -270, the same.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the crawl through the public chain at two writings of each heading and compares the displayed toe and foot joints over the way down; a foot whose roll turns by the written yaw rather than the angle it names fails with the joint, the distance and the second.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the identity of an angle and that angle plus a whole turn, which holds for any correct law; the millimetre is a rounding bound far under any visible turn of a foot.
 * @evidence contracts/development/testing.md#distinguishing-cases Two headings, each written below and past the half turn, so both directions of the wrap are read; the yaw 0 crawl of the crawl-down spec is the case that needs no wrap.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds four performances in memory, reading their displayed bones.
 * @evidence contracts/development/common.md#meaningful-documentation States the relation, the two scenarios and the bound.
 */
export function test_motion_gait_floor_travel_posture(): void {
  const complaints: string[] = [];
  checkFloorPhases(complaints);
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const perform: (yaw: number) => IAutoMovieMotionHumanPerformance = (
    yaw: number,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "crawl-heading",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").crawl({ kind: "knees", count: 1 })
        .node,
    });
  for (const [written, named] of [
    [270, -90],
    [90, -270],
  ] as const) {
    const a: IAutoMovieMotionHumanPerformance = perform(written);
    const b: IAutoMovieMotionHumanPerformance = perform(named);
    const [crawl]: readonly IAutoMovieMotionHumanSegment[] = a.segments("a");
    const down: number =
      crawl!.start +
      (crawl!.plan.events.find((e): boolean => e.name === "down")?.share ?? 0) *
        crawl!.plan.duration;
    let worst: IWorstBone = {
      distance: 0,
      seconds: 0,
      bone: "none",
    };
    for (let t: number = 0; t <= down; t += 1 / 24)
      for (const bone of [
        "leftFoot",
        "rightFoot",
        "leftToes",
        "rightToes",
      ] as const) {
        const p: IAutoMovieVector3 | undefined = a
          .bones("a", t)
          .get(bone)?.worldPosition;
        const q: IAutoMovieVector3 | undefined = b
          .bones("a", t)
          .get(bone)?.worldPosition;
        if (p === undefined || q === undefined) continue;
        const distance: number = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
        if (distance > worst.distance) worst = { distance, seconds: t, bone };
      }
    if (worst.distance > 1e-3)
      complaints.push(
        `yaw ${written} against ${named}: ${worst.bone} ${(worst.distance * 1000).toFixed(1)} mm apart at ${worst.seconds.toFixed(2)} s`,
      );
  }
  TestValidator.equals(
    "a crawl's way down is the same at either writing of its heading",
    complaints,
    [],
  );
}

/** Bone with the greatest discrepancy at a sampled second. */
interface IWorstBone {
  distance: number;
  seconds: number;
  bone: string;
}

function checkFloorPhases(findings: string[]): void {
  const body = motionHumanBody("f-small");
  for (const kind of ["knees", "bear", "inchworm"] as const) {
    const p = new HumanPerformance({
      seed: "crawl",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").crawl({ kind, count: 1 }).node,
    });
    const segment = p.segments("a")[0]!;
    const reader = HumanSignature(p, "a", body, 0);
    const time = (share: number): number =>
      segment.start + share * segment.plan.duration;
    const event = (name: string): number =>
      time(segment.plan.events.find((e) => e.name === name)?.share ?? NaN);
    const down = event("down");
    const check = (ok: boolean, label: string): void => {
      if (!ok) findings.push(kind + " " + label);
    };
    const limbs = ["leftHand", "rightHand", "leftFoot", "rightFoot"] as const;
    if (kind !== "inchworm") {
      for (const fault of HumanVerdicts(p, 24, { from: 0, to: down }).findings)
        if (fault.check !== "floor")
          findings.push(
            kind +
              " " +
              fault.check +
              " " +
              fault.value +
              " at " +
              fault.seconds,
          );
      let penetration = 0;
      for (let t = 0; t <= down; t += 1 / 24)
        for (const placed of HumanColliders.placed(body, p.bones("a", t)))
          if (!/Hand$|Thumb|Index|Middle|Ring|Little/.test(placed.bone))
            for (const shape of placed.shapes)
              penetration = Math.max(
                penetration,
                -physicalShapeBounds(placed.pose, shape).min.y,
              );
      check(
        penetration <= AutoMovieMotionHumanAudit.LIMITS.floor,
        "floor penetration " + penetration,
      );
      let low = Infinity;
      for (let t = down; t <= segment.end; t += 0.05)
        for (const side of ["left", "right"] as const)
          low = Math.min(
            low,
            HumanSignature.joint(reader, t, `${side}LowerLeg`).y -
              body.measure.shankRadius,
          );
      check(
        kind === "bear" ? low >= 0.02 : low <= 0.015,
        "minimum knee clearance " + low,
      );
      if (kind === "bear") {
        const windows = (part: string) =>
          segment.plan.contacts.filter(
            (c) => c.part === part && c.kind === "plant",
          );
        const landed = Math.min(
          ...[...windows("leftHand"), ...windows("rightHand")].map(
            (w) => w.from,
          ),
        );
        for (const [hand, foot] of [
          ["leftHand", "rightFoot"],
          ["rightHand", "leftFoot"],
        ] as const) {
          const hands = windows(hand),
            feet = windows(foot);
          check(
            hands.length > 0 &&
              hands.length === feet.length &&
              hands.every(
                (w, i) =>
                  Math.abs(w.from - Math.max(landed, feet[i]!.from)) <= 1e-9 &&
                  Math.abs(w.to - feet[i]!.to) <= 1e-9,
              ),
            "contralateral support " + hand,
          );
          for (const w of feet)
            check(
              Math.abs(
                HumanSignature.sole(
                  reader,
                  time((w.from + w.to) / 2),
                  foot === "leftFoot" ? "left" : "right",
                ).y,
              ) <= 0.015,
              "planted " + foot,
            );
        }
      }
      continue;
    }
    const plank = event("plank1"),
      fold = event("folded1"),
      rise = event("rising");
    const middle = (at: number, part: MidJoint): IAutoMovieVector3 =>
      Vector3.lerp(
        HumanSignature.joint(reader, at, `left${part}`),
        HumanSignature.joint(reader, at, `right${part}`),
        0.5,
      );
    const ankles = middle(plank, "Foot"),
      shoulders = middle(plank, "UpperArm"),
      hips = middle(plank, "UpperLeg");
    const line = Vector3.subtract(shoulders, ankles);
    check(
      Vector3.length(Vector3.cross(line, Vector3.subtract(hips, ankles))) /
        Vector3.length(line) <=
        0.04,
      "plank hip alignment",
    );
    const wrists = Vector3.subtract(middle(plank, "Hand"), shoulders);
    check(
      Math.hypot(wrists.x, wrists.z) <=
        0.1 * (body.measure.upperArm + body.measure.forearm),
      "wrists below shoulders",
    );
    for (const t of [plank, fold])
      for (const side of ["left", "right"] as const)
        check(
          Math.abs(HumanSignature.sole(reader, t, side).y) <= 0.015,
          "sole support at " + t,
        );
    check(
      middle(fold, "UpperLeg").y - middle(fold, "UpperArm").y >= 0.1,
      "fold hip clearance",
    );
    const end = segment.end - 0.001;
    check(
      Math.abs(
        middle(end, "UpperLeg").y - middle(segment.start, "UpperLeg").y,
      ) <= 0.03 &&
        middle(end, "Foot").z - middle(segment.start, "Foot").z >= 0.3,
      "returns to standing after travel",
    );
    // A contact count can only change at a window endpoint. Check each open interval.
    const bounds = [
      down,
      rise,
      ...segment.plan.contacts
        .flatMap((w) => [time(w.from), time(w.to)])
        .filter((t) => t > down && t < rise),
    ].sort((a, b) => a - b);
    for (let i = 1; i < bounds.length; i++) {
      const share =
        ((bounds[i]! + bounds[i - 1]!) / 2 - segment.start) /
        segment.plan.duration;
      check(
        limbs.filter((part) =>
          segment.plan.contacts.some(
            (w) =>
              w.part === part && w.from <= share + 1e-9 && w.to >= share - 1e-9,
          ),
        ).length >= 3,
        "three bearing limbs at " + share,
      );
    }
    for (const limb of limbs) {
      const steps = segment.plan.events.filter((e) =>
        e.name.startsWith(limb + "Liftoff"),
      );
      check(steps.length > 0, "has a " + limb + " step");
      for (const e of steps) {
        const off = time(e.share),
          on = event(e.name.replace("Liftoff", "Touchdown"));
        check(
          off < on &&
            (limb.endsWith("Hand")
              ? on <= plank + 1e-9
              : on > plank && on <= fold + 1e-9),
          limb + " step order",
        );
      }
    }
  }
}
type MidJoint = "UpperArm" | "UpperLeg" | "Hand" | "Foot";
