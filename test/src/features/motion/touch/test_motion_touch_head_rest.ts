import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformer,
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

const { headRest } = AutoMovieMotionHumanTouch;

/**
 * How near the resting region stays to the partner's region, metres
 * (provisional: a skin contact).
 */
const NEAR: number = 0.01;

/** How long the head rests, seconds. */
const REST: number = 3;

/** One of the two on the bench: `a` rests, `b` is rested on. */
type BenchSubject = "a" | "b";

/** How long each sit holds before what follows, seconds (staging). */
const SAT: number = 1.5;

/**
 * How much deeper the resting one sits on the bench, metres (provisional:
 * sitting back, the temple comes over the partner's shoulder rather than ahead
 * of it).
 */
const DEEPER: number = 0.08;

/**
 * The gap left between the two on the bench, metres (provisional: the resting
 * one sits a little apart, so the side lean carries the head over onto the
 * shoulder).
 */
const GAP: number = 0.2;

/**
 * How far apart the two sit, metres between their hips: each one's hip joint
 * half width and thigh radius, the seated hips' half breadth, and the gap.
 */
function apart(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): number {
  return (
    a.measure.hipHalfWidth +
    a.measure.thighRadius +
    b.measure.hipHalfWidth +
    b.measure.thighRadius +
    GAP
  );
}

/** One bench pair: who rests on whom. */
interface IPair {
  /** The resting performer's body. */
  resting: motionHumanBody.Name;

  /** The partner's body. */
  partner: motionHumanBody.Name;
}

/**
 * Resting the head on a partner's shoulder on a bench (#4012).
 *
 * Scenarios, the small woman on the average man and on the tall man, each take
 * clean (the neck within its range, no body in the other):
 *
 * 1. The resting temple stays on the partner's shoulder through the rest.
 * 2. The rest is a loaded contact window of the head on the partner's shoulder,
 *    sharing the load.
 * 3. Standing, the small woman cannot rest on the tall man's shoulder: the refusal
 *    states the miss.
 *
 * The second scenario and the following of the partner's turn need the head as
 * a contact part and a per-second aim at the partner's region (motion-core);
 * until those land, this specification fails there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases, the bounds and what is pending.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed temple against the partner's displayed shoulder region through the rest and the plan's contact windows; a head off the shoulder, an unloaded or missing head window, or an admitted unreachable rest fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound and the load shares of the contact contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs of different height differences, a wrapping partner arm, the standing refusal.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_touch_head_rest(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const pairs: readonly IPair[] = [
    { resting: "f-small", partner: "m-average" },
    { resting: "f-small", partner: "m-tall" },
  ];
  for (const pair of pairs) {
    try {
      const label: string = `${pair.resting} rests on ${pair.partner}`;
      const a: IAutoMovieMotionHumanBody = motionHumanBody(pair.resting);
      const b: IAutoMovieMotionHumanBody = motionHumanBody(pair.partner);
      const film: HumanPerformance = bench(a, b);
      verdict(checks, label, film);
      const rest: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find(
          (segment: IAutoMovieMotionHumanSegment): boolean =>
            segment.name === "headRest",
        )!;
      const contact: number = mark(rest, "contact");
      const part: number = mark(rest, "part");
      const misses: readonly number[] = [0, 0.25, 0.5, 0.75, 1].map(
        (share: number): number => {
          const t: number = contact + share * (part - contact);
          return Vector3.distance(
            region(film, "a", a, "templeLeft", t),
            region(film, "b", b, "shoulderRight", t),
          );
        },
      );
      checks.check(
        `${label}: the temple stays on the shoulder (${misses.map((m: number): string => (m * 1000).toFixed(1)).join(", ")} mm)`,
        misses.every((m: number): boolean => m <= NEAR),
      );
      const window: IAutoMovieMotionHumanContactWindow | undefined =
        rest.plan.contacts.find(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            (w.part as string) === "head" &&
            w.support.kind === "person" &&
            w.support.subject === "b",
        );
      checks.check(
        `${label}: the head bears on the partner in a loaded window`,
        window !== undefined &&
          window.load !== undefined &&
          window.load > 0 &&
          window.load < 1,
      );
    } catch (error: unknown) {
      checks.check(`${String(pair)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.check(
    "the small woman cannot rest standing on the tall man's shoulder",
    (() => {
      try {
        standing(motionHumanBody("f-small"), motionHumanBody("m-tall")).bones(
          "a",
          2,
        );
        return false;
      } catch (error: unknown) {
        return (
          error instanceof HumanRefusal &&
          error.axis === "region" &&
          /mm from the partner's shoulderRight/.test(error.message)
        );
      }
    })(),
  );
  checks.assert("touch head rest");
}

/**
 * `a` and `b` sit side by side, `b` on `a`'s left; `a` rests on `b`'s right
 * shoulder while `b`'s right arm wraps around `a`.
 */
function bench(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): HumanPerformance {
  const height: number = Math.min(
    AutoMovieMotionHumanSeat.seated.popliteal(a),
    AutoMovieMotionHumanSeat.seated.popliteal(b),
  );
  const seat: (
    x: number,
    body: IAutoMovieMotionHumanBody,
    back: number,
  ) => IAutoMovieMotionHumanSeated.ISeat = (
    x: number,
    body: IAutoMovieMotionHumanBody,
    back: number,
  ): IAutoMovieMotionHumanSeated.ISeat => ({
    at: { x, y: height, z: body.rest.get("leftFoot")!.z - 0.1 - back },
    yaw: 0,
    depth: 0.45,
  });
  const performers: IAutoMovieMotionHumanPerformer[] = [
    {
      subject: "a",
      body: a,
      at: { x: -apart(a, b) / 2, y: 0, z: -DEEPER },
      yaw: 0,
      proficiency: { level: "trained" },
    },
    {
      subject: "b",
      body: b,
      at: { x: apart(a, b) / 2, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    },
  ];
  const sits: Record<BenchSubject, IAutoMovieMotionHumanSeated.ISeat> = {
    a: seat(-apart(a, b) / 2, a, DEEPER),
    b: seat(apart(a, b) / 2, b, 0),
  };
  // Each one's sit read once alone, from where it is staged: when she is
  // seated, and how long his sit takes before its hold. He holds his sit
  // until she is seated, so his wrap reaches for her back where it rests,
  // not where it passes while she sits down.
  const alone = (subject: BenchSubject): IAutoMovieMotionHumanSegment =>
    new HumanPerformance({
      seed: "head-rest",
      performers: performers.filter(
        (p: IAutoMovieMotionHumanPerformer): boolean => p.subject === subject,
      ),
      composition: HumanChain.subject(subject).sit({
        seat: sits[subject],
        hold: SAT,
      }).node,
    }).segments(subject)[0]!;
  const seatedAt: number = mark(alone("a"), "seated");
  const settling: number = alone("b").plan.duration - SAT;
  const wait: number = Math.max(SAT, seatedAt - settling);
  return new HumanPerformance({
    seed: "head-rest",
    laws: [headRest],
    performers,
    // The partner's right arm wraps around behind the resting one, the palm
    // on her upper back, and holds there through the rest, so his upper arm
    // lies behind her back, not beside her shoulder where her lean would
    // press into it. Her far shoulder lies 83 mm beyond his arm at his seated
    // lean's limit. The partner is placed first, so the resting head reads
    // where the partner sits.
    composition: HumanChain.subject("b")
      .sit({ seat: sits.b, hold: wait })
      .touch({
        target: { kind: "person", subject: "a", region: "lowerBack" },
        hand: "right",
        kind: "hold",
        hold: REST + 2,
      })
      .with(
        HumanChain.subject("a")
          .sit({ seat: sits.a, hold: SAT })
          .registered(headRest.name, {
            partner: "b",
            region: "shoulderRight",
            hold: REST,
          }),
      ).node,
  });
}

/** `a` stands beside `b`, on `b`'s right, and rests on `b`'s right shoulder. */
function standing(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): HumanPerformance {
  return new HumanPerformance({
    seed: "head-rest-standing",
    laws: [headRest],
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: -apart(a, b) / 2, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: apart(a, b) / 2, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").registered(headRest.name, {
      partner: "b",
      region: "shoulderRight",
      hold: REST,
    }).node,
  });
}

/** A body region's displayed point. */
function region(
  film: HumanPerformance,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  name: AutoMovieHumanoidRegion,
  t: number,
): IAutoMovieVector3 {
  const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
    body.surfaces.regions[name];
  return resolveAutoMovieHumanoidSurfaces.place(
    frame,
    film.bones(subject, t).get(frame.bone)!,
  ).point;
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
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
