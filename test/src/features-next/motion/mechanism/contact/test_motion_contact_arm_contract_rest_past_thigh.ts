import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { armCourseContract } from "../../../internal/armCourseContract";
import { motionActionUnit } from "../../../internal/motionActionUnit";

/**
 * The arm planner's contract on its first canonical case: from the hanging
 * rest to a site past the thigh. A standing performer lays the left palm on
 * the front of its own left thigh, so the course leaves the rest beside the
 * thigh and must pass round it to reach the site ahead of it (`touch`, the
 * planner's public seam),
 * whatever the planner's algorithm, on the average man and the small woman.
 *
 * Scenarios:
 * 1. At the touch's `ready` the palm lies on the thigh's front region within the
 *    touch contract's 10 mm.
 * 2. The course stays clear by the audit's bounds: no part of the body more
 *    than 10 mm in another, nothing 5 mm under the floor.
 * 3. The course is continuous: no jump, out-and-back spike or snap.
 * 4. The course keeps the audit's speed, and the left wrist stays within
 *    30 m/s read at ten times the film rate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the canonical case, the seam, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the touch through the public chain and reads the displayed palm against the displayed thigh region, the displayed wrist's speed and the verdict report over the touch; a palm short of the thigh, an arm through the thigh or trunk, a jump or snap or an impossible speed fails, and no planner row, knot or iteration is read.
 * @evidence contracts/development/testing.md#independent-expectations The site tolerance is the touch contract's 10 mm, the clearance, continuity and speed bounds the audit's stated limits (`HumanVerdicts`, 30 m/s); none is read from the planner.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the partner, the seated rise, the two arms and the held prop are the other canonical cases of `test_motion_contact_arm_contract_*`.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_contact_arm_contract_rest_past_thigh`.
 */
export function test_motion_contact_arm_contract_rest_past_thigh(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name}: rest to the thigh's front`;
    try {
      verify(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert(
    "the arm course from rest to a site past the thigh keeps its contract",
  );
}

/** One body's course and its checks. */
function verify(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const take: HumanPerformance = new HumanPerformance({
    seed: "arm-contract",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").touch({
      target: { kind: "self", region: "thighFrontLeft" },
      hand: "left",
      kind: "hold",
    }).node,
  });
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "a",
    "touch",
  );
  const ready: number = motionActionUnit.event(act, "ready");
  const thigh: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.regions.thighFrontLeft,
    take.bones("a", ready).get(body.surfaces.regions.thighFrontLeft.bone)!,
  ).point;
  const palm: IAutoMovieVector3 = HumanHand.frame(
    body,
    take.bones("a", ready),
    "left",
    "palm",
  ).point;
  const off: number = Vector3.distance(palm, thigh);
  checks.check(
    `${label}: the palm reaches the thigh's front (${(off * 1000).toFixed(1)} mm)`,
    off <= armCourseContract.SITE,
  );
  armCourseContract.course(checks, label, take, "a", act, ["left"]);
}
