import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
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
 * The arm planner's contract on its fourth canonical case: a two-arm reach. A
 * standing performer lays both palms on the shoulders of a partner standing
 * 0.5 m ahead facing it, the two arms planned at once (`touch` with `other`,
 * the planner's public seam), whatever the planner's algorithm, the average
 * man on the small woman and the reverse.
 *
 * Scenarios:
 * 1. At the touch's `ready` each of the partner's shoulder regions has a palm
 *    on it within the touch contract's 10 mm.
 * 2. The two courses stay clear by the audit's bounds, of each other, of the
 *    performer's body and of the partner.
 * 3. The courses are continuous: no jump, out-and-back spike or snap.
 * 4. The courses keep the audit's speed, and each wrist stays within 30 m/s
 *    read at ten times the film rate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the canonical case, the seam, the pairs and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the two-handed touch through the public chain and reads the displayed palms against the partner's displayed shoulders, the displayed wrists' speed and the verdict report over the touch; a palm short of a shoulder, arms through each other, the body or the partner, a jump or snap or an impossible speed fails, and no planner internal is read.
 * @evidence contracts/development/testing.md#independent-expectations The site tolerance is the touch contract's 10 mm, the clearance, continuity and speed bounds the audit's stated limits; which hand takes which shoulder is the law's choice, so each shoulder is read against the nearer palm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two pairs of different heights, two arms against the single-arm cases of the other `test_motion_contact_arm_contract_*`.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_contact_arm_contract_two_arm_reach`.
 */
export function test_motion_contact_arm_contract_two_arm_reach(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [toucher, partner] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${toucher} on ${partner}'s shoulders`;
    try {
      verify(checks, label, motionHumanBody(toucher), motionHumanBody(partner));
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("the two-arm course keeps its contract");
}

/** One pair's two-arm course and its checks. */
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
          target: { kind: "person", subject: "b", region: "shoulderLeft" },
          other: { kind: "person", subject: "b", region: "shoulderRight" },
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
  const palms: readonly IAutoMovieVector3[] = (["left", "right"] as const).map(
    (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      HumanHand.frame(a, take.bones("a", ready), side, "palm").point,
  );
  for (const region of ["shoulderLeft", "shoulderRight"] as const) {
    const at: IAutoMovieVector3 = place(take, b, region, ready);
    const off: number = Math.min(
      ...palms.map((palm: IAutoMovieVector3): number =>
        Vector3.distance(palm, at),
      ),
    );
    checks.check(
      `${label}: a palm reaches the partner's ${region} (${(off * 1000).toFixed(1)} mm)`,
      off <= armCourseContract.SITE,
    );
  }
  armCourseContract.course(checks, label, take, "a", act, ["left", "right"]);
}

/** The partner's region at a second, world metres. */
function place(
  take: HumanPerformance,
  b: IAutoMovieMotionHumanBody,
  region: AutoMovieHumanoidRegion,
  t: number,
): IAutoMovieVector3 {
  return resolveAutoMovieHumanoidSurfaces.place(
    b.surfaces.regions[region],
    take.bones("b", t).get(b.surfaces.regions[region].bone)!,
  ).point;
}
