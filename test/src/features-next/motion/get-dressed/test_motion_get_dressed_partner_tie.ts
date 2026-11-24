import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGetDressed,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * How near the palm comes to the partner's sternum at the stroke, metres: a
 * skin contact through a shirt (provisional).
 */
const NEAR: number = 0.02;

/**
 * Straightening a partner's tie, facing them (#4015).
 *
 * Scenarios, the average man straightening the small woman's tie and the
 * reverse, each take clean:
 *
 * 1. The smoothing hand's palm reaches the partner's sternum at the touch's
 *    stroke.
 * 2. The touch bears on the partner, not on the dresser's own chest.
 *
 * Each pair and each check gather their own results, so a refused pair hides no
 * other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, the cases and the bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed palm against the partner's displayed sternum and the plan's target; a hand short of the partner, or a touch on the dresser's own body, fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin contact through a shirt; the target is the composition's stated partner.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs of different heights; the touch's own forms are the touch specification's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_get_dressed_partner_tie(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [dresser, partner] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${dresser} straightens ${partner}'s tie`;
    try {
      straighten(checks, label, dresser, partner);
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("partner tie");
}

/** One pair's straightening and its checks. */
function straighten(
  checks: motionComplaints.IGatherer,
  label: string,
  dresser: motionHumanBody.Name,
  partner: motionHumanBody.Name,
): void {
  const a: IAutoMovieMotionHumanBody = motionHumanBody(dresser);
  const b: IAutoMovieMotionHumanBody = motionHumanBody(partner);
  const film: HumanPerformance = new HumanPerformance({
    seed: "partner-tie",
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
        AutoMovieMotionHumanGetDressed.straightenPartnerTie(
          HumanChain.subject("a"),
          { partner: "b", side: "right" },
        ),
      ).node,
  });
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(`${label}: ${everydayTake.describe(error)}`, false);
  }
  const touch: IAutoMovieMotionHumanSegment = film
    .segments("a")
    .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "touch")!;
  checks.check(
    `${label}: the touch bears on the partner`,
    touch.plan.contacts.some(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.support.kind === "person" && w.support.subject === "b",
    ),
  );
  const at: number =
    touch.start +
    touch.plan.duration *
      touch.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "stroke",
      )!.share;
  const tip: IAutoMovieVector3 = HumanHand.frame(
    a,
    film.bones("a", at),
    "right",
    "palm",
    "flat",
  ).point;
  const sternum: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    b.surfaces.regions.sternum,
    film.bones("b", at).get(b.surfaces.regions.sternum.bone)!,
  ).point;
  checks.check(
    `${label}: the palm reaches the partner's sternum (${(Vector3.distance(tip, sternum) * 1000).toFixed(0)} mm)`,
    Vector3.distance(tip, sternum) <= NEAR,
  );
}
