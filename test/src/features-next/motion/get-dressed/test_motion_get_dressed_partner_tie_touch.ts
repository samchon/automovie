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

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionActionUnit } from "../../internal/motionActionUnit";

/**
 * How near the palm comes to the partner's sternum at the stroke, metres: a
 * skin contact through a shirt (provisional), the original's bound.
 */
const NEAR: number = 0.02;

/**
 * The flat palm smooths a partner's tie, on its own: the one touch of
 * `test_motion_get_dressed_partner_tie`, the average man straightening the
 * small woman's tie and the reverse, the partner given explicitly standing 0.5
 * m ahead facing the dresser, as the original stages it.
 *
 * Scenarios:
 *
 * 1. The touch bears on the partner: a contact window on person `b`.
 * 2. At the touch's stroke the palm lies within 20 mm of the partner's displayed
 *    sternum.
 * 3. The touch keeps the shipped bounds over its own span, the partner bound
 *    between the two bodies included.
 *
 * The original stops at its first failure, so pair 1's refusal hid pair 2; here
 * each pair reports on its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original it decomposes, the staging, the pairs and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plan's windows, the displayed palm against the partner's displayed sternum and the verdict report over the touch's span; a touch on the dresser's own body, a palm short of the partner, a hand through the partner or a finding in the touch fails, each pair on its own.
 * @evidence contracts/development/testing.md#independent-expectations The skin contact through a shirt and the partner the composition names, as the original; the rest the verdicts' shipped limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs of different heights; the touch's own forms are the touch specification's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_get_dressed_partner_tie_touch`.
 */
export function test_motion_get_dressed_partner_tie_touch(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [dresser, partner] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${dresser} straightens ${partner}'s tie`;
    try {
      verify(checks, label, motionHumanBody(dresser), motionHumanBody(partner));
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("the palm smooths the partner's tie");
}

/** One pair's touch and its checks. */
function verify(
  checks: motionComplaints.IGatherer,
  label: string,
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): void {
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
  const touch: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    film,
    "a",
    "touch",
  );
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
  motionActionUnit.bounds(checks, label, film, "a", touch);
}
