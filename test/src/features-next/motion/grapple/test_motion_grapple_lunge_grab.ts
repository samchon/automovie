import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGrapple,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HUMAN_LEXICON, HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { performanceAimFrame } from "../../../features/internal/performanceAimFrame";

/** The pair's separation no lunge covers, metres. */
const FAR: number = 3;
/** A palm closes on its region within this of the region's surface point, metres: a palm's half width. */
const GRIP: number = 0.05;
/** The hands and the regions they close on, for a right lead facing the victim. */
const HOLDS: readonly (readonly [
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
])[] = [
  ["right", "shoulderLeft"],
  ["left", "shoulderRight"],
];

/**
 * A shambler lunges at a victim and grabs both shoulders, on two bodies.
 *
 * Scenarios:
 * 1. The lunge closes a gap the arms alone cannot span: at the grab's
 *    contact each palm is on its shoulder.
 * 2. The take passes the shipped verdict report: the rear foot does not
 *    slide, nothing passes through the victim.
 * 3. A victim beyond the longest lunge is refused on `partner`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the setup and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered lungeGrab row through HumanPerformance and reads palms, the victim's bones, the schedule and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The separations are authored; the grip bound is a palm's half width from the region's surface point.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, a reachable and an unreachable victim.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_grapple_lunge_grab(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const label of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    const victim: IAutoMovieMotionHumanBody = motionHumanBody(
      label === "m-average" ? "f-small" : "m-average",
    );
    try {
      // Beyond the arms, inside a lunge: an arm and a hand from the shoulder,
      // then half the law's longest lunge (its hips' travel in hip heights).
      const apart: number =
        body.measure.upperArm +
        body.measure.forearm +
        body.measure.hand +
        (AutoMovieMotionHumanGrapple.lungeGrab.LONGEST *
          body.measure.hipHeight) /
          2;
      const film: HumanPerformance = perform(body, victim, apart);
      const grab: IAutoMovieScheduleEntry = film.schedule.entries.find(
        (e: IAutoMovieScheduleEntry): boolean => e.intent?.anchor === "lunge",
      )!;
      const at: number = grab.contact ?? grab.end;
      for (const [side, region] of HOLDS) {
        const palm: IAutoMovieVector3 = HumanHand.frame(
          body,
          film.bones("a", at),
          side,
          "palm",
          "flat",
        ).point;
        const site: IAutoMovieVector3 = film.aim(
          { kind: "person", subject: "v", region },
          at,
          performanceAimFrame(film, "a", body, at),
        ).point;
        const gap: number = Vector3.distance(palm, site);
        checks.check(
          `${label}: the ${side} palm closes on the ${region} (${gap.toFixed(3)} m)`,
          gap <= GRIP,
        );
      }
      assertTakeClean(`${label} lunge grab`, film);
    } catch (error: unknown) {
      checks.check(`${label} lunge refused: ${String(error)}`, false);
    }
    let refusal: unknown = undefined;
    try {
      perform(body, victim, FAR);
    } catch (error: unknown) {
      refusal = error;
    }
    checks.check(
      `${label}: a far victim is refused on partner: ${String(refusal)}`,
      refusal instanceof HumanRefusal && refusal.axis === "partner",
    );
  }
  checks.assert("lunge grab");
}

/** A shambler facing a standing victim at a separation, lunging at it. */
function perform(
  body: IAutoMovieMotionHumanBody,
  victim: IAutoMovieMotionHumanBody,
  apart: number,
): HumanPerformance {
  return new HumanPerformance({
    seed: "lunge-grab",
    laws: Object.values(HUMAN_LEXICON).flat(),
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "v",
        body: victim,
        at: { x: 0, y: 0, z: apart },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .registered("lungeGrab", { partner: "v" }, "lunge")
      .with(HumanChain.subject("v").stand({ hold: 4, sway: 0 })).node,
  });
}
