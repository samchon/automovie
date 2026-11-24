import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanColliders, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

const { shoulderClasp } = AutoMovieMotionHumanTouch;

/**
 * Two facing performers start a reciprocal shoulder clasp after a standing
 * beat. Each right hand holds on the other's left shoulder for at least 0.8 seconds.
 *
 * Scenarios:
 * 1. Both reaches start at the joined entry and honor the requested hold.
 * 2. Both hands make palm contact within 10 mm of the opposing shoulder
 *    over the shared hold, sampled at its quarter points and midpoint.
 * 3. The hands are clear of those surfaces at entry and after release.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, requested hold and three observable scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the displayed palm against the shoulder surface, including whether their normals face each other.
 * @evidence contracts/development/testing.md#independent-expectations The 0.8-second dwell is authored input, the shoulder point is placed on the partner's displayed bone, and 10 mm is the existing touch contact tolerance. A few samples bound the checked instants.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both directions of contact and the entry and release outside contact. The touch-law specifications cover unreachable targets and asymmetric body fits.
 * @evidence contracts/development/testing.md#execution-ownership The feature runner discovers this in-memory integration test. It builds one performance from an average polygon body.
 */
export function test_motion_touch_social_shoulder_clasp(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const hold: number = 0.8;
  const start: number = 0.3;
  const film: HumanPerformance = new HumanPerformance({
    seed: "shoulder-clasp",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: { x: 0, y: 0, z: 0.45 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.mutual(
      shoulderClasp,
      {
        one: HumanChain.subject("a").stand({ hold: start }),
        other: HumanChain.subject("b").stand({ hold: start }),
      },
      { hold },
    ).node,
  });
  const first: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
  const second: IAutoMovieMotionHumanSegment = film.segments("b")[1]!;

  /** A touch event in film seconds. */
  const event = (
    segment: IAutoMovieMotionHumanSegment,
    name: "strokeEnd" | "relax",
  ): number =>
    segment.start +
    segment.plan.events.find((entry): boolean => entry.name === name)!.share *
      segment.plan.duration;

  /** The displayed right palm's gap and facing relative to its opposing shoulder. */
  const contact = (
    subject: string,
    other: string,
    time: number,
  ): { gap: number; clearance: number; facing: boolean } => {
    const shoulder = body.surfaces.regions.shoulderLeft;
    const target = resolveAutoMovieHumanoidSurfaces.place(
      shoulder,
      film.bones(other, time).get(shoulder.bone)!,
    );
    const bones = film.bones(subject, time);
    const palm: ReturnType<typeof HumanHand.frame> = HumanHand.frame(
      body,
      bones,
      "right",
      "palm",
      "flat",
    );
    const hand = new Map(
      [...bones].filter(([bone]): boolean =>
        /^right(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone),
      ),
    );
    return {
      gap: Vector3.length(Vector3.subtract(palm.point, target.point)),
      clearance: HumanColliders.distance(body, hand, target.point).distance,
      facing: Vector3.dot(palm.normal, target.normal) < 0,
    };
  };

  const sharedFrom: number = Math.max(
    event(first, "strokeEnd"),
    event(second, "strokeEnd"),
  );
  const sharedTo: number = Math.min(
    event(first, "relax"),
    event(second, "relax"),
  );
  TestValidator.predicate(
    "the two holds overlap for at least half the dwell",
    sharedTo - sharedFrom >= hold / 2,
  );
  for (const [subject, other, segment] of [
    ["a", "b", first],
    ["b", "a", second],
  ] as const) {
    TestValidator.predicate(
      `${subject} starts at the joined entry`,
      nclose(segment.start, start),
    );
    TestValidator.predicate(
      `${subject} holds for the requested dwell`,
      event(segment, "relax") - event(segment, "strokeEnd") >= hold - 0.001,
    );
    for (const share of [0.25, 0.5, 0.75]) {
      const time: number = sharedFrom + share * (sharedTo - sharedFrom);
      const seen = contact(subject, other, time);
      TestValidator.predicate(
        `${subject}'s palm contacts the shoulder at ${share} of the overlap (${seen.gap} m)`,
        nclose(seen.gap, 0, 0.01) && seen.clearance >= -0.01 && seen.facing,
      );
    }
    TestValidator.predicate(
      `${subject} has yet to touch at entry`,
      contact(subject, other, start).clearance > 0.01,
    );
    TestValidator.predicate(
      `${subject} has left the shoulder at the end`,
      contact(subject, other, segment.start + segment.plan.duration).clearance >
        0.01,
    );
  }
}
