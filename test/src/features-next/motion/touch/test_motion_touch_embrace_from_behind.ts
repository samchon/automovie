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
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { embraceFromBehind } = AutoMovieMotionHumanTouch;

/** How near two regions in contact stay, metres: the law's skin contact. */
const NEAR: number = 0.01;

/**
 * How near a palm lies to the abdomen, metres: a skin contact and the palm's
 * own thickness (provisional).
 */
const PALM: number = 0.03;

/**
 * How far toward the partner's left the embracer stands, metres: none, centred
 * behind the partner with the shoulders square, so both arms pass around the
 * partner's flanks to the clasp on the midline (staged 0.08 m aside, the right
 * shoulder stood inside the partner's chest's breadth and the right arm's way
 * to the clasp ran through the partner's chest). The head leans and turns to
 * the shoulder the chin rests on.
 */
const ASIDE: number = 0;

/** How long the embrace is held, seconds. */
const HOLD: number = 2;

/**
 * The gap left between the chest and the back standing upright for the average
 * man, metres, scaled with the embracer's stature (provisional staging: a short
 * step back, so the lean that closes it carries the head forward over the
 * shoulder).
 */
const GAP: number = 0.2;

/**
 * Embracing a partner from behind (#4012).
 *
 * Scenarios, the average man embracing another average man and the small woman
 * embracing another small woman, each take clean:
 *
 * 1. Through the hold, the chest lies on the partner's upper back, the chin on the
 *    top of the partner's left shoulder (its region; rested halfway to the
 *    neck's side, the head lay in the partner's neck), and each palm on the
 *    partner's abdomen within a hand's length of its middle: the palms lie
 *    either side of the midline, their fingertips meeting at it.
 * 2. The chest, the chin and the palms bear on the partner in windows, the chest's
 *    loaded.
 * 3. The small woman cannot rest her chin on the tall man's shoulder from behind:
 *    the refusal states the miss. On another small woman's she can: the same
 *    staging builds without a refusal.
 *
 * Each pair, each check and the refusal gather their own results, so a refused
 * pair hides neither the other pair nor the refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scenes, the bounds and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed regions of both bodies through the hold and the plan's windows; a chest off the back, a chin off the shoulder, a palm off the abdomen, a missing or unloaded window, or an admitted unreachable shoulder fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound; the palm bound adds the palm's thickness.
 * @evidence contracts/development/testing.md#distinguishing-cases Two pairs of equal heights, and a large height difference refused beside an equal one admitted.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_touch_embrace_from_behind(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} embraces ${name} from behind`;
    try {
      embrace(checks, label, motionHumanBody(name), motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  const tall: HumanRefusal | undefined = refusal("m-tall");
  checks.check(
    `the small woman cannot rest her chin on the tall man's shoulder (${describe(tall)})`,
    tall !== undefined &&
      tall.axis === "partner" &&
      /mm from the partner's shoulder/.test(tall.message),
  );
  const equal: HumanRefusal | undefined = refusal("f-small");
  checks.check(
    `the small woman rests her chin on another small woman's shoulder (${describe(equal)})`,
    equal === undefined,
  );
  checks.assert("embrace from behind");
}

/** One pair's embrace and its checks. */
function embrace(
  checks: motionComplaints.IGatherer,
  label: string,
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): void {
  const film: HumanPerformance = scene(a, b);
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(`${label}: ${everydayTake.describe(error)}`, false);
  }
  const act: IAutoMovieMotionHumanSegment = film
    .segments("a")
    .find(
      (s: IAutoMovieMotionHumanSegment): boolean =>
        s.name === "embraceFromBehind",
    )!;
  const from: number = mark(act, "ready");
  const to: number = mark(act, "relax");
  for (const t of [from, (from + to) / 2, to]) {
    const chest: number = Vector3.distance(
      region(film, "a", a, "sternum", t),
      region(film, "b", b, "upperBack", t),
    );
    const top: IAutoMovieVector3 = region(film, "b", b, "shoulderLeft", t);
    const chin: number = Vector3.distance(region(film, "a", a, "chin", t), top);
    const palms: readonly number[] = (["palmLeft", "palmRight"] as const).map(
      (palm: AutoMovieHumanoidRegion): number =>
        Vector3.distance(
          region(film, "a", a, palm, t),
          region(film, "b", b, "abdomen", t),
        ),
    );
    checks.check(
      `${label}: at ${t.toFixed(2)} s the chest (${(chest * 1000).toFixed(0)} mm) and the chin (${(chin * 1000).toFixed(0)} mm) rest on the partner`,
      chest <= NEAR && chin <= NEAR,
    );
    checks.check(
      `${label}: at ${t.toFixed(2)} s the palms lie on the abdomen (${palms.map((p: number): string => (p * 1000).toFixed(0)).join(", ")} mm)`,
      palms.every((p: number): boolean => p <= PALM + a.measure.hand),
    );
  }
  const windows: readonly IAutoMovieMotionHumanContactWindow[] =
    act.plan.contacts.filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.support.kind === "person" && w.support.subject === "b",
    );
  checks.check(
    `${label}: chest, chin and palms bear on the partner, the chest loaded`,
    windows.length === 4 &&
      windows.some(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part === "chest" && w.load !== undefined && w.load > 0,
      ),
  );
}

/** The refusal the small woman's embrace of a partner throws, if any. */
function refusal(partner: motionHumanBody.Name): HumanRefusal | undefined {
  return everydayTake.refusal(() =>
    scene(motionHumanBody("f-small"), motionHumanBody(partner)).bones("a", 1),
  );
}

/** A refusal's axis and message, or that the build was admitted. */
function describe(refused: HumanRefusal | undefined): string {
  return refused === undefined
    ? "admitted"
    : `${refused.axis}: ${refused.message}`;
}

/** `b` stands ahead facing away; `a` steps in behind and embraces. */
function scene(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): HumanPerformance {
  return new HumanPerformance({
    seed: "embrace-from-behind",
    laws: [embraceFromBehind],
    performers: [
      {
        // Behind the partner's left shoulder, where the chin goes.
        subject: "a",
        body: a,
        at: { x: ASIDE, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: {
          x: 0,
          y: 0,
          // The step back scaled with the embracer's stature from the
          // average man's, so every body closes it by the same lean.
          z:
            (a.measure.chestDepth + b.measure.chestDepth) / 2 +
            (GAP * a.measure.stature) /
              motionHumanBody("m-average").measure.stature,
        },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    // The partner is placed first, so the embrace reads where the partner stands.
    composition: HumanChain.subject("b")
      .stand({ hold: HOLD + 4 })
      .with(
        HumanChain.subject("a").registered(embraceFromBehind.name, {
          partner: "b",
          hold: HOLD,
        }),
      ).node,
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
