import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDance,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { headRest } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** How near the two cheeks stay, metres: `headRest`'s skin contact. */
const NEAR: number = 0.01;

/** The slow dance's beat, seconds (the author's: a 60 beats a minute ballad). */
const BEAT: number = 1;

/** How far the follower's pelvis sways over each foot, metres (the author's). */
const SWAY: number = 0.03;

/** How many sways the follower makes. */
const SWAYS: number = 2;

/** How far apart the two faces' right sides stand across, metres: two cheeks' offsets from the midline, so the right cheeks line up (provisional staging). */
const ACROSS: number = 0.12;

/** How far the two stand apart beyond their chests' half depths, metres (staging: the hips clear of each other, the lean closing the heads). */
const CLEAR: number = 0.2;

/** One pair: who rests a cheek on whose. */
interface IPair {
  /** The resting performer. */
  resting: motionHumanBody.Name;

  /** The swaying partner. */
  partner: motionHumanBody.Name;
}

/**
 * Dancing cheek to cheek (#4012): in a slow dance, the partner sways from
 * foot to foot on the beat and the other rests a right cheek on the
 * partner's right cheek, following the sway.
 *
 * Scenarios, two average men and two small women, each take clean (no body
 * in the other, the neck within its range):
 * 1. The right cheeks stay within 10 mm of each other through the rest,
 *    while the partner sways.
 * 2. The rest is a loaded head window on the partner's cheek.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, the cases and the bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads both displayed cheeks through the rest and the plan's head window; a cheek left behind by the sway, pressed in, or an unloaded window fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound of `headRest`; the load share lies strictly inside 0 and 1.
 * @evidence contracts/development/testing.md#distinguishing-cases Two pairs of matched height on two bodies; a large height difference's refusal, the bench rest and the standing rest are the head rest specification's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_dance_cheek_to_cheek(): void {
  const pairs: readonly IPair[] = [
    { resting: "m-average", partner: "m-average" },
    { resting: "f-small", partner: "f-small" },
  ];
  for (const pair of pairs) {
    const label: string = `${pair.resting} dances cheek to cheek with ${pair.partner}`;
    const a: IAutoMovieMotionHumanBody = motionHumanBody(pair.resting);
    const b: IAutoMovieMotionHumanBody = motionHumanBody(pair.partner);
    const apart: number =
      (a.measure.chestDepth + b.measure.chestDepth) / 2 + CLEAR;
    const film: HumanPerformance = new HumanPerformance({
      seed: "cheek-to-cheek",
      laws: [headRest, AutoMovieMotionHumanStance.shiftStandingWeight],
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: ACROSS / 2, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: { x: -ACROSS / 2, y: 0, z: apart },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      // The swaying partner is placed first, so the resting head reads it.
      composition: AutoMovieMotionHumanDance.slowDanceSway(
        HumanChain.subject("b").stand({ hold: 1 }),
        {
          by: SWAY,
          beat: BEAT,
          count: SWAYS,
        },
      ).with(
        HumanChain.subject("a").registered(headRest.name, {
          partner: "b",
          region: "cheekRight",
          own: "cheekRight",
          hold: 2 * SWAYS * BEAT,
        }),
      ).node,
    });
    assertTakeClean(label, film);
    const rest: IAutoMovieMotionHumanSegment = film
      .segments("a")
      .find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "headRest",
      )!;
    const from: number = mark(rest, "contact");
    const to: number = mark(rest, "part");
    const misses: readonly number[] = Array.from(
      { length: 9 },
      (_v: unknown, k: number): number => {
        const t: number = from + ((to - from) * k) / 8;
        return Vector3.distance(
          region(film, "a", a, "cheekRight", t),
          region(film, "b", b, "cheekRight", t),
        );
      },
    );
    TestValidator.predicate(
      `${label}: the cheeks stay together through the sway (${misses.map((m: number): string => (m * 1000).toFixed(1)).join(", ")} mm)`,
      misses.every((m: number): boolean => m <= NEAR),
    );
    const window: IAutoMovieMotionHumanContactWindow | undefined =
      rest.plan.contacts.find(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part === "head" && w.support.kind === "person",
      );
    TestValidator.predicate(
      `${label}: the cheek bears on the partner in a loaded window`,
      window !== undefined &&
        window.load !== undefined &&
        window.load > 0 &&
        window.load < 1,
    );
  }
}

/** A body region's displayed point. */
function region(
  film: HumanPerformance,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  name: AutoMovieHumanoidRegion,
  t: number,
): IAutoMovieVector3 {
  return resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.regions[name],
    film.bones(subject, t).get(body.surfaces.regions[name].bone)!,
  ).point;
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share
  );
}
