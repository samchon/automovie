import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionKneelSignature } from "../../../features/internal/motionKneelSignature";
import { motionPostureBranches } from "../../../features/internal/motionPostureBranches";

/**
 * Kneeling on both knees and sitting back keep the required floor contacts.
 *
 * Scenarios:
 * 1. Upright kneeling holds both knees near right angles with upright thighs.
 * 2. Sitting back folds both knees while keeping their support on the floor.
 * 3. Omitting the rise leaves a two-knee base with both knees still bearing.
 * 4. Through every foot plant window the toe pads stay within 5 mm, a flat
 *    foot's and a tucked foot's that rolls over them alike.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two floor supports and how their held geometry differs.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual law, reading the joint geometry at the hold and the unchanged audits throughout the transition.
 * @evidence contracts/development/testing.md#independent-expectations The standard upright and folded kneeling postures establish the hip and knee angles in motionKneelSignature.
 * @evidence contracts/development/testing.md#distinguishing-cases Both knees bear in each posture. Degree of flexion separates upright kneeling from sitting back, on opposite stature extremes.
 * @evidence contracts/development/testing.md#execution-ownership Two returning films share geometry and audit, and one held film supplies the independent terminal branch.
 */
export function test_motion_support_kneel_support(): void {
  const signature: motionComplaints.IGatherer = motionComplaints();
  const findings: string[] = motionPostureBranches(
    [
      ["kneel", "default", "m-large"],
      ["kneel", "kind=both", "m-large"],
      ["kneel", "kind=sitBack", "f-small"],
    ],
    (film, [, row, name]): void => {
      motionKneelSignature(
        signature,
        film,
        name,
        row === "default" ? "one" : row === "kind=both" ? "both" : "sitBack",
      );
    },
  );
  const body = motionHumanBody("m-average");
  for (const [kind, rise] of [
    ["one", false],
    ["sitBack", false],
    ["one", true],
  ] as const) {
    const p = new HumanPerformance({
      seed: "kneel",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").kneel({ kind, hold: 1, rise }).node,
    });
    const segment = p.segments("a")[0]!,
      reader = HumanSignature.of(p, "a", body, 0),
      end = segment.end;
    const tolerance = 0.06 * body.measure.stature;
    const knees = ["left", "right"] as const;
    const heights = knees.map(
      (side) => HumanSignature.joint(reader, end, `${side}LowerLeg`).y,
    );
    if (!rise)
      signature.check(
        kind + " knee support",
        Math.min(...heights) <= tolerance &&
          (kind === "one"
            ? Math.max(...heights) - Math.min(...heights) > tolerance
            : Math.max(...heights) <= tolerance),
      );
    else {
      const hip = (t: number) =>
        knees.reduce(
          (y, side) =>
            y + HumanSignature.joint(reader, t, `${side}UpperLeg`).y / 2,
          0,
        );
      signature.check(
        "kneel recovers quiet standing height",
        Math.abs(hip(end) - hip(0)) <= 0.02 &&
          knees.every((side) => HumanSignature.bears(reader, end, side)),
      );
    }
    for (const c of segment.plan.contacts) {
      if (
        c.kind !== "plant" ||
        (c.part !== "leftFoot" && c.part !== "rightFoot")
      )
        continue;
      const side = c.part === "leftFoot" ? "left" : "right";
      const from = Math.max(
          segment.entryTime,
          segment.start + c.from * segment.plan.duration,
        ),
        to = Math.min(end, segment.start + c.to * segment.plan.duration);
      if (to - from < 0.1) continue;
      // A planted foot's toe pads stay where they bear: a flat foot's and a
      // tucked foot's alike, the tucked foot standing on them with its toes
      // extended while its ankle rolls over them.
      const pads = (t: number) =>
        HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
          (s) => s.socket === "toe",
        )!.point;
      const first = pads(from + 0.02);
      for (const t of HumanSignature.times(
        from + 0.02,
        to - 0.02,
        3 / (to - from - 0.04),
      )) {
        const at = pads(t);
        signature.check(
          kind + " " + c.part + " plant at " + t,
          Math.hypot(at.x - first.x, at.y - first.y, at.z - first.z) <= 0.005,
        );
      }
    }
  }
  signature.list.push(...findings);
  signature.assert(
    "Both floor kneels hold their distinct geometry and contact",
  );
}
