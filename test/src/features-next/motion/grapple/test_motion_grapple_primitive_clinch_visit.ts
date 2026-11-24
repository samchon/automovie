import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

/**
 * A bilateral visit reaches two distinct partner skin sites and exits the shared interval.
 *
 * Scenarios:
 * 1. Use two initially level reference points and inspect both hand windows through approach and return.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A bilateral visit reaches two distinct partner skin sites and exits the shared interval.
 * @evidence contracts/development/testing.md#independent-expectations The two contacts name their own anatomical regions. Independent posed meshes supply distances for the 10 mm physical skin allowance.
 * @evidence contracts/development/testing.md#distinguishing-cases Use two initially level reference points and inspect both hand windows through approach and return.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_grapple_primitive_clinch_visit(): void {
  const a: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("f-average");
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "clinch-contact-activation",
    [
      { subject: "a", body: a },
      { subject: "b", body: b, at: { x: 0, y: 0, z: 0.55 }, yaw: 180 },
    ],
    HumanChain.subject("a")
      .act("clinch", {
        partner: "b",
        grip: "collarSleeve",
        under: { fulcrum: "sternum", on: "sternum" },
      })
      .with(HumanChain.subject("b").stand({ hold: 4, sway: 0 })),
  );
  const segment: IAutoMovieMotionHumanSegment =
    film.performance.segments("a")[0]!;
  const windows: readonly IAutoMovieMotionHumanContactWindow[] =
    segment.plan.contacts.filter(
      (w) => w.kind === "grip" && w.support.kind === "person",
    );
  const all: motionComplaints.IGatherer = motionComplaints();
  all.check(
    "each hand owns exactly one partner window",
    windows.length === 2 && new Set(windows.map((w) => w.part)).size === 2,
  );
  for (const w of windows) {
    if (w.support.kind !== "person" || !("region" in w.support)) continue;
    const side: AutoMovieHumanSide = w.part === "leftHand" ? "left" : "right";
    for (const share of [w.from, (w.from + w.to) / 2, w.to]) {
      const time: number = segment.start + share * segment.plan.duration;
      const targetBone = b.surfaces.regions[w.support.region].bone;
      const hand = new RegExp(
        "^" + side + "(Hand|Thumb|Index|Middle|Ring|Little)",
      );
      const target = new RegExp("^" + targetBone + "$");
      const gap: number = fixture.separation(
        a,
        film.bones("a", time),
        hand,
        b,
        film.bones("b", time),
        target,
      );
      all.check(
        `${side} on ${w.support.region} at ${time}: signed gap ${gap} m`,
        Math.abs(gap) <= 0.01,
      );
    }
  }
  all.assert("two independent limb channels retain their own partner region");
}
