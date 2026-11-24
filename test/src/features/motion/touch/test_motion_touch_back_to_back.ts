import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

const { backToBack } = AutoMovieMotionHumanTouch;

/**
 * How near the two upper backs stay, metres: twice the law's skin contact, one
 * each side of the meeting point.
 */
const NEAR: number = 0.02;

/** How long the two lean, seconds. */
const HOLD: number = 2;

/**
 * The gap left between the seated upper backs before leaning, metres
 * (provisional staging: each lean closes half).
 */
const GAP: number = 0.08;

/** One pair seated back to back. */
interface IPair {
  /** The first seated, facing `-Z`. */
  a: motionHumanBody.Name;

  /** The second seated, facing `+Z`. */
  b: motionHumanBody.Name;
}

/**
 * Two people sitting back to back and leaning on each other (#4012).
 *
 * Scenarios, the average man with the small woman and two small women, each
 * take clean:
 *
 * 1. Through the hold, the two upper backs meet: they lie within 20 mm of each
 *    other across the floor, each at its own height.
 * 2. Each back bears on the other's in a loaded window.
 * 3. One partner sitting up while the other still leans is refused, naming the
 *    lean left on nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scenes, the bounds and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads both displayed upper backs through the hold and both plans' windows; backs apart, pressed through each other, unloaded windows, or an admitted withdrawn support fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound each side of the meeting point; a load share strictly inside 0 and 1.
 * @evidence contracts/development/testing.md#distinguishing-cases A mixed and a matched pair, and an unequal hold refused.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, each body's seated back read once from its own sit alone to stage the pair.
 */
export function test_motion_touch_back_to_back(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const pairs: readonly IPair[] = [
    { a: "m-average", b: "f-small" },
    { a: "f-small", b: "f-small" },
  ];
  for (const pair of pairs) {
    try {
      const label: string = `${pair.a} and ${pair.b} sit back to back`;
      const a: IAutoMovieMotionHumanBody = motionHumanBody(pair.a);
      const b: IAutoMovieMotionHumanBody = motionHumanBody(pair.b);
      const film: HumanPerformance = scene(a, b, HOLD);
      verdict(checks, label, film);
      const lean: IAutoMovieMotionHumanSegment = film
        .segments("b")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean => s.name === "backToBack",
        )!;
      const from: number = mark(lean, "lean");
      const to: number = mark(lean, "part");
      // Across the floor: two bodies of unequal stature carry their upper
      // backs at unequal heights, and the backs meet on the upright plane
      // between them, each at its own height.
      const gaps: readonly number[] = [from, (from + to) / 2, to].map(
        (t: number): number => {
          const apart: IAutoMovieVector3 = Vector3.subtract(
            back(film, "a", a, t),
            back(film, "b", b, t),
          );
          return Math.hypot(apart.x, apart.z);
        },
      );
      checks.check(
        `${label}: the upper backs meet (${gaps.map((g: number): string => (g * 1000).toFixed(0)).join(", ")} mm)`,
        gaps.every((g: number): boolean => g <= NEAR),
      );
      for (const subject of ["a", "b"] as const) {
        const window: IAutoMovieMotionHumanContactWindow | undefined = film
          .segments(subject)
          .find(
            (s: IAutoMovieMotionHumanSegment): boolean =>
              s.name === "backToBack",
          )!
          .plan.contacts.find(
            (w: IAutoMovieMotionHumanContactWindow): boolean =>
              w.part === "back" && w.support.kind === "person",
          );
        checks.check(
          `${label}: ${subject}'s back bears on the other's in a loaded window`,
          window !== undefined &&
            window.load !== undefined &&
            window.load > 0 &&
            window.load < 1,
        );
      }
    } catch (error: unknown) {
      checks.check(`${String(pair)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.check(
    "one sitting up while the other still leans is refused",
    (() => {
      try {
        scene(
          motionHumanBody("m-average"),
          motionHumanBody("f-small"),
          HOLD / 2,
        ).bones("b", 2);
        return false;
      } catch (error: unknown) {
        return (
          error instanceof HumanRefusal &&
          (error.axis === "hold" || error.axis === "with")
        );
      }
    })(),
  );
  checks.assert("touch back to back");
}

/**
 * `a` and `b` sit back to back and lean on each other, `b` holding its lean
 * `second` seconds against `a`'s `HOLD`.
 */
function scene(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  second: number,
): HumanPerformance {
  // Each one's seated upper back, read once from sitting alone facing +Z
  // from the origin; the pair is set that far apart less the gap.
  const seat = (
    body: IAutoMovieMotionHumanBody,
    sign: number,
    at: number,
  ): IAutoMovieMotionHumanSeated.ISeat => ({
    at: {
      x: 0,
      y: AutoMovieMotionHumanSeat.seated.popliteal(body),
      z: sign * (at + body.rest.get("leftFoot")!.z - 0.1),
    },
    yaw: sign > 0 ? 0 : 180,
    depth: 0.4,
  });
  const behind = (body: IAutoMovieMotionHumanBody): number => {
    const alone: HumanPerformance = new HumanPerformance({
      seed: "sit-alone",
      performers: [
        {
          subject: "x",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("x").sit({
        seat: seat(body, 1, 0),
        hold: 0.5,
      }).node,
    });
    return -back(alone, "x", body, alone.duration).z;
  };
  const d: number = (behind(a) + behind(b) + GAP) / 2;
  // One sits down, then the other, then both lean from the same instant.
  // Each lowers itself with its hands on the bench behind it, which is where
  // the other's hands go, so the two sit in turn rather than at once (at once
  // a's fingers met b's hand 20 mm deep). Each lean reads the other's seated
  // back at its start, and the law needs the two leans to begin within a
  // frame, so neither lean is chained straight after its own sit. `a`'s lean
  // is placed first; `b` checks its own against `a`'s by its anchor.
  const composition: IAutoMovieComposition = {
    kind: "sequence",
    parts: [
      HumanChain.subject("a").sit({ seat: seat(a, -1, d), hold: 0.5 }).node,
      HumanChain.subject("b").sit({ seat: seat(b, 1, d), hold: 0.5 }).node,
      HumanChain.subject("a")
        .registered(backToBack.name, { partner: "b", hold: HOLD }, "leanA")
        .with(
          HumanChain.subject("b").registered(backToBack.name, {
            partner: "a",
            hold: second,
            with: "leanA",
          }),
        ).node,
    ],
  };
  return new HumanPerformance({
    seed: "back-to-back",
    laws: [backToBack],
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: 0, y: 0, z: -d },
        yaw: 180,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: d },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition,
  });
}

/** A performer's displayed upper back. */
function back(
  film: HumanPerformance,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  t: number,
): IAutoMovieVector3 {
  return resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.regions.upperBack,
    film.bones(subject, t).get(body.surfaces.regions.upperBack.bone)!,
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

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
