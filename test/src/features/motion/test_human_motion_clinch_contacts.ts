import type {
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditPartner,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A real clinch keeps both displayed bodies out of one another within the
 * partner audit's 10 mm skin allowance. This is the activation evidence
 * #3438 requires before a hold is adapted by an interaction mesh; a direct
 * mesh API test alone cannot show that a shipped hold needs adaptation.
 *
 * The placement is the grappling family's existing stage: the partner
 * stands 0.55 m ahead, facing the holder. The partner stands without sway,
 * the holder takes the existing plum or collar-and-sleeve grip, and the
 * public partner audit reads every segment in both directions at its
 * default 24 Hz over the entire performance.
 *
 * Scenarios:
 * 1. The average man holding the average woman, the reference pair of
 *    #3438, in both grips.
 * 2. The small woman holding the large man, and the large man holding the
 *    small woman, in both grips: every actual tangle is reported with its
 *    body pair, segment pair, depth and instant; a planning refusal is
 *    reported separately from a tangle.
 * 3. Separately audit the intersection of the law's original grip windows,
 *    at the same rate, and record its exact bounds and worst depth. A
 *    collision during transport alone does not activate a key-hold
 *    adaptation; a collision during this declared hold does.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the shipped clinch through HumanChain and HumanPerformance and audits its displayed bodies with AutoMovieMotionHumanAuditPartner; a real overlap or refusal fails with the complete case rather than inferring a hold defect from an unused mesh API.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm bound is HumanVerdicts.SKIN and the 0.55 m staging is the existing grappling stage; neither is read from the clinch's solve or adjusted to its result.
 * @evidence contracts/development/testing.md#distinguishing-cases Both shipped grip kinds on the average reference pair and both orders of the opposite-build pair, with both directed readings over the whole action and separately over the intersection of its original grip windows.
 * @evidence contracts/development/testing.md#execution-ownership Prepares four polygon men, constructs six short public performances and audits them in memory; the normal feature-test discovery runs the test locally and in CI, without a viewer or capture.
 * @evidence contracts/development/common.md#meaningful-documentation States the conditional issue this evidence serves, the existing staging and skin bound, and both scenarios.
 */
export function test_human_motion_clinch_contacts(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const pairs: readonly (readonly [
    motionHumanBody.Name,
    motionHumanBody.Name,
  ])[] = [
    ["m-average", "f-average"],
    ["f-small", "m-large"],
    ["m-large", "f-small"],
  ];
  for (const names of pairs)
    for (const grip of ["plum", "collarSleeve"] as const) {
      const cell: string = `${grip}, ${names[0]} holding ${names[1]}`;
      const bodies: Record<"a" | "b", IAutoMovieMotionHumanBody> = {
        a: motionHumanBody(names[0]),
        b: motionHumanBody(names[1]),
      };
      try {
        const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
          seed: "clinch-contact-activation",
          performers: [
            {
              subject: "a",
              body: bodies.a,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
            {
              subject: "b",
              body: bodies.b,
              at: { x: 0, y: 0, z: 0.55 },
              yaw: 180,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .act("clinch", { partner: "b", grip })
            .with(HumanChain.subject("b").stand({ seconds: 4, sway: 0 })).node,
        });
        const report: IAutoMovieMotionHumanAuditPartner.IResult =
          AutoMovieMotionHumanAuditPartner.measure(
            film,
            { subject: "a", body: bodies.a },
            { subject: "b", body: bodies.b },
          );
        all.check(
          `${cell}: ${report.worst.where} penetrates ${(report.worst.value * 1000).toFixed(2)} mm at ${report.worst.seconds.toFixed(4)} s, at most ${HumanVerdicts.SKIN * 1000} mm expected`,
          report.worst.value <= HumanVerdicts.SKIN,
        );
        const segment = film.segments("a").find((s) => s.name === "clinch")!;
        const grips = segment.plan.contacts.filter((w) => w.kind === "grip");
        const from: number = Math.max(
          ...grips.map((w) => segment.start + w.from * segment.plan.duration),
        );
        const to: number = Math.min(
          ...grips.map((w) => segment.start + w.to * segment.plan.duration),
        );
        all.check(`${cell}: the declared grips overlap for a hold`, to > from);
        if (!(to > from)) continue;
        const held: IAutoMovieMotionHumanAuditPartner.IResult =
          AutoMovieMotionHumanAuditPartner.measure(
            {
              duration: to - from,
              bones: (subject, t) => film.bones(subject, from + t),
              segments: (subject) => film.segments(subject),
            },
            { subject: "a", body: bodies.a },
            { subject: "b", body: bodies.b },
          );
        all.check(
          `${cell}, declared hold (window ${from.toFixed(4)}-${to.toFixed(4)} s): ${held.worst.where} penetrates ${(held.worst.value * 1000).toFixed(2)} mm at ${(from + held.worst.seconds).toFixed(4)} s, at most ${HumanVerdicts.SKIN * 1000} mm expected`,
          held.worst.value <= HumanVerdicts.SKIN,
        );
      } catch (error) {
        all.check(
          `${cell}: expected the shipped hold to plan and be auditable, read ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
      }
    }
  all.assert("the shipped clinch keeps its real partner contacts clear");
}
