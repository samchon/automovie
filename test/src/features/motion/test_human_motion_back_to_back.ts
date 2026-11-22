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
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  backToBack,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** How near the two upper backs stay, metres: twice the law's skin contact, one each side of the meeting point. */
const NEAR: number = 0.02;

/** How long the two lean, seconds. */
const HOLD: number = 2;

/** The gap left between the seated upper backs before leaning, metres (provisional staging: each lean closes half). */
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
 * Scenarios, the average man with the small woman and two small women,
 * each take clean:
 * 1. Through the hold, the two upper backs meet: they lie within 20 mm of
 *    each other.
 * 2. Each back bears on the other's in a loaded window.
 * 3. One partner sitting up while the other still leans is refused, naming
 *    the lean left on nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scenes, the bounds and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads both displayed upper backs through the hold and both plans' windows; backs apart, pressed through each other, unloaded windows, or an admitted withdrawn support fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound each side of the meeting point; a load share strictly inside 0 and 1.
 * @evidence contracts/development/testing.md#distinguishing-cases A mixed and a matched pair, and an unequal hold refused.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, each body's seated back read once from its own sit alone to stage the pair.
 */
export function test_human_motion_back_to_back(): void {
  const pairs: readonly IPair[] = [
    { a: "m-average", b: "f-small" },
    { a: "f-small", b: "f-small" },
  ];
  for (const pair of pairs) {
    const label: string = `${pair.a} and ${pair.b} sit back to back`;
    const a: IAutoMovieMotionHumanBody = motionHumanBody(pair.a);
    const b: IAutoMovieMotionHumanBody = motionHumanBody(pair.b);
    const film: HumanPerformance = scene(a, b, HOLD);
    assertTakeClean(label, film);
    const lean: IAutoMovieMotionHumanSegment = film
      .segments("b")
      .find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "backToBack",
      )!;
    const from: number = mark(lean, "lean");
    const to: number = mark(lean, "part");
    const gaps: readonly number[] = [from, (from + to) / 2, to].map(
      (t: number): number =>
        Vector3.distance(back(film, "a", a, t), back(film, "b", b, t)),
    );
    TestValidator.predicate(
      `${label}: the upper backs meet (${gaps.map((g: number): string => (g * 1000).toFixed(0)).join(", ")} mm)`,
      gaps.every((g: number): boolean => g <= NEAR),
    );
    for (const subject of ["a", "b"] as const) {
      const window: IAutoMovieMotionHumanContactWindow | undefined = film
        .segments(subject)
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean => s.name === "backToBack",
        )!
        .plan.contacts.find(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            w.part === "back" && w.support.kind === "person",
        );
      TestValidator.predicate(
        `${label}: ${subject}'s back bears on the other's in a loaded window`,
        window !== undefined &&
          window.load !== undefined &&
          window.load > 0 &&
          window.load < 1,
      );
    }
  }
  TestValidator.predicate(
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
          (error.axis === "seconds" || error.axis === "with")
        );
      }
    })(),
  );
}

/** `a` and `b` sit back to back and lean on each other, `b` holding its lean `second` seconds against `a`'s `HOLD`. */
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
      y: seated.popliteal(body),
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
        seconds: 0.5,
      }).node,
    });
    return -back(alone, "x", body, alone.duration).z;
  };
  const d: number = (behind(a) + behind(b) + GAP) / 2;
  // Both sit down, then both lean from the same instant: each lean reads the
  // other's seated back at its start, and the law needs the two leans to
  // begin within a frame. Two bodies take unequal times to sit, so leans
  // chained straight after each sit would start apart, one reading a partner
  // still sitting down. `a`'s lean is placed first; `b` checks its own
  // against `a`'s by its anchor.
  const composition: IAutoMovieComposition = {
    kind: "sequence",
    parts: [
      HumanChain.subject("a")
        .sit({ seat: seat(a, -1, d), seconds: 0.5 })
        .with(
          HumanChain.subject("b").sit({ seat: seat(b, 1, d), seconds: 0.5 }),
        ).node,
      HumanChain.subject("a")
        .registered(backToBack.name, { partner: "b", seconds: HOLD }, "leanA")
        .with(
          HumanChain.subject("b").registered(backToBack.name, {
            partner: "a",
            seconds: second,
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
