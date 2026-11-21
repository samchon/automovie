import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanHand,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The pair's separation for a lunge, metres: beyond the arms, inside a lunge. */
const LUNGE: number = 1.05;
/** The pair's separation no lunge covers, metres. */
const FAR: number = 3;
/** A palm closes on its region within this of the region's bone, metres: a shoulder's half depth and a palm. */
const GRIP: number = 0.14;
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
 * @evidence contracts/development/testing.md#independent-expectations The separations are authored; the grip bound is a shoulder's half depth and a palm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, a reachable and an unreachable victim.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_human_motion_lunge_grab(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const label of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    const victim: IAutoMovieMotionHumanBody = motionHumanBody(
      label === "m-average" ? "f-small" : "m-average",
    );
    try {
      const film: HumanPerformance = perform(body, victim, LUNGE);
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
        const bone: IAutoMovieVector3 = film
          .bones("v", at)
          .get(victim.surfaces.regions[region].bone)!.worldPosition;
        const gap: number = Vector3.distance(palm, bone);
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
      .stand({ seconds: 0.3, sway: 0 })
      .act("lungeGrab", { partner: "v" }, "lunge")
      .with(HumanChain.subject("v").stand({ seconds: 4, sway: 0 })).node,
  });
}
