import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { armCourseContract } from "../../../internal/armCourseContract";
import { motionActionUnit } from "../../../internal/motionActionUnit";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * The arm planner's contract on its second canonical case: a palm on a
 * partner's sternum. A standing performer lays the right palm on the sternum of
 * a partner standing 0.5 m ahead facing it (`touch`, the planner's public
 * seam), whatever the planner's algorithm, the average man on the small woman
 * and the reverse.
 *
 * Scenarios:
 *
 * 1. At the touch's `ready` the palm lies on the partner's sternum region within
 *    the touch contract's 10 mm.
 * 2. The course stays clear by the audit's bounds, the partner bound between the
 *    two bodies included.
 * 3. The course is continuous: no jump, out-and-back spike or snap.
 * 4. The course keeps the audit's speed, and the right wrist stays within 30 m/s
 *    read at ten times the film rate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the canonical case, the seam, the pairs and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the touch through the public chain and reads the displayed palm against the partner's displayed sternum, the displayed wrist's speed and the verdict report over the touch; a palm short of the partner, a hand through the partner's chest or the performer's own, a jump or snap or an impossible speed fails, and no planner internal is read.
 * @evidence contracts/development/testing.md#independent-expectations The site tolerance is the touch contract's 10 mm, the clearance, continuity and speed bounds the audit's stated limits (`HumanVerdicts`, 30 m/s); none is read from the planner.
 * @evidence contracts/development/testing.md#distinguishing-cases Two pairs of different heights; the other canonical cases are the other `test_motion_contact_arm_contract_*`.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_contact_arm_contract_partner_sternum`.
 */
export function test_motion_contact_arm_contract_partner_sternum(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [toucher, partner] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${toucher} on ${partner}'s sternum`;
    try {
      verify(checks, label, motionHumanBody(toucher), motionHumanBody(partner));
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("the arm course to a partner's sternum keeps its contract");
}

/** One pair's course and its checks. */
function verify(
  checks: motionComplaints.IGatherer,
  label: string,
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): void {
  const take: HumanPerformance = new HumanPerformance({
    seed: "arm-contract",
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: 0.5 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],

    // The partner is placed first, so the touch reads where the partner stands.
    composition: HumanChain.subject("b")
      .stand({ hold: 6 })
      .with(
        HumanChain.subject("a").touch({
          target: { kind: "person", subject: "b", region: "sternum" },
          hand: "right",
          kind: "hold",
        }),
      ).node,
  });
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "a",
    "touch",
  );
  const ready: number = motionActionUnit.event(act, "ready");
  const sternum: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    b.surfaces.regions.sternum,
    take.bones("b", ready).get(b.surfaces.regions.sternum.bone)!,
  ).point;
  const palm: IAutoMovieVector3 = HumanHand.frame(
    a,
    take.bones("a", ready),
    "right",
    "palm",
  ).point;
  const off: number = Vector3.distance(palm, sternum);
  checks.check(
    `${label}: the palm reaches the partner's sternum (${(off * 1000).toFixed(1)} mm)`,
    off <= armCourseContract.SITE,
  );
  armCourseContract.course(checks, label, take, "a", act, ["right"]);
}
