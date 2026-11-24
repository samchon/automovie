import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain, HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

/**
 * Two statures of horizontal separation exceed the planted kisser's reach.
 * Scenarios:
 * 1. Keep two planted performers separated by two statures and inspect the public reach refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the staging and its reach failure.
 * @evidence contracts/development/testing.md#behavioral-verification Requires the public performance to report a reach refusal on the region.
 * @evidence contracts/development/testing.md#independent-expectations The target lies two standing body heights away.
 * @evidence contracts/development/testing.md#distinguishing-cases The original distant stage measures horizontal refusal independently of the two close-contact scenes.
 * @evidence contracts/development/testing.md#execution-ownership One attempted performance.
 */
export function test_motion_prehension_hand_grip_refusal(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const a: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const separation = 2 * b.measure.stature;
  const minimumGap = separation - a.measure.stature - b.measure.stature;
  let refused: unknown;
  try {
    motionHumanLaw.perform(
      "kiss-reach",
      [
        { subject: "a", body: a },
        {
          subject: "b",
          body: b,
          at: { x: 0, y: 0, z: separation },
          yaw: 180,
        },
      ],
      HumanChain.subject("a")
        .act("kiss", { partner: "b", region: "forehead" })
        .with(HumanChain.subject("b").stand({ hold: 6, sway: 0 })),
    );
  } catch (error: unknown) {
    refused = error;
  }
  all.check(
    `beyond reach the kiss names its region: ${String(refused)}`,
    refused instanceof HumanRefusal &&
      refused.kind === "reach" &&
      refused.axis === "region" &&
      refused.value === "forehead" &&
      refused.feasible?.kind === "range" &&
      refused.feasible.unit === "m" &&
      minimumGap > (refused.feasible.maximum ?? Infinity),
  );
  all.assert("an unreachable forehead is refused on its region");
}
