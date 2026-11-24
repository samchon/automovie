import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanLieTogether,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSleep,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * How near the resting region stays to the partner's, metres: the law's skin
 * contact and its rest gap.
 */
const NEAR: number = 0.015;

/**
 * How far below the floor any bone may lie, metres: the verdicts' floor
 * tolerance, read on the joints (provisional).
 */
const FLOOR: number = 0.01;

/** How long the two lie together, seconds. */
const HOLD: number = 3;

/**
 * How far from its settled place the performer is staged to lie, metres: clear
 * of the partner while lying down, within the settling arm's reach.
 */
const NEARBY: number = 0.6;

/** One way of lying together and the regions it brings together. */
interface IWay {
  /** The way. */
  way: IAutoMovieMotionHumanLieTogether.Way;

  /** How the partner lies. */
  partner: IAutoMovieMotionHumanLieDown.Position;

  /** How the performer lies. */
  own: IAutoMovieMotionHumanLieDown.Position;

  /** The performer's resting region. */
  mine: AutoMovieHumanoidRegion;

  /** The partner's region it rests on. */
  theirs: AutoMovieHumanoidRegion;
}

/**
 * Lying together on the floor (#4012): spooning, and the head on the partner's
 * chest.
 *
 * Scenarios, the average man with the small woman for each way, each take
 * clean:
 *
 * 1. Through the hold, the performer's chest lies on the partner's back (spooning,
 *    at the height the performer's own lying width gives its midline) or its
 *    lower cheek on the partner's surface by the chest, as the partner
 *    breathes. With the head on the chest the performer is staged out to the
 *    partner's side along the shoulders, its head toward the partner, since a
 *    chest's level normal on a body lying on its back points along the body.
 * 2. Both bodies stay on the floor: no bone under it.
 * 3. The resting region bears on the partner in a window.
 * 4. Lying far from the partner is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scenes, the bounds and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed regions of both bodies through the hold, both bodies' bones against the floor and the plan's windows; a contact that drifts as the partner breathes, a body through the floor or a missing window fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound and the floor.
 * @evidence contracts/development/testing.md#distinguishing-cases Two ways, and a performer lying apart refused.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, each body's lying place read once from its own lie alone to stage the pair.
 */
export function test_motion_sleep_lie_together(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const ways: readonly IWay[] = [
    {
      way: "spoon",
      partner: "lateralLeft",
      own: "lateralLeft",
      mine: "sternum",
      theirs: "upperBack",
    },
    {
      way: "chest",
      partner: "supine",
      own: "lateralRight",
      mine: "cheekRight",
      theirs: "chestLeft",
    },
  ];
  const a: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  for (const w of ways) {
    try {
      const label: string = `m-average and f-small lie together (${w.way})`;
      const film: HumanPerformance = scene(a, b, w, NEARBY);
      verdict(checks, label, film);
      const act: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.name === "lieTogether",
        )!;
      const from: number =
        act.start +
        act.plan.duration *
          act.plan.events.find(
            (e: IAutoMovieMotionEvent): boolean => e.name === "settled",
          )!.share;
      // Spooning, both bodies lie on the same side on one floor, so each
      // midline stands at its own lying height: the resting point is the
      // partner's region raised by the two bodies' difference in that height,
      // read from each lying alone.
      const raised: number =
        w.way === "spoon"
          ? lain(a, w.own, w.mine).point.y -
            lain(b, w.partner, w.theirs).point.y
          : 0;
      // With the head on the chest, the cheek rests on the partner's surface
      // by the shoulder, wherever the body beside the partner lets it reach,
      // so it is read against the partner's colliders, not a region's centre.
      const misses: readonly number[] = [0, 0.5, 1].map((k: number): number => {
        const t: number = from + k * (act.end - from);
        const mine: IAutoMovieVector3 = region(film, "a", a, w.mine, t);
        if (w.way === "chest")
          return Math.abs(
            HumanColliders.distance(b, film.bones("b", t), mine).distance,
          );
        const theirs: IAutoMovieVector3 = region(film, "b", b, w.theirs, t);
        return Vector3.distance(mine, { ...theirs, y: theirs.y + raised });
      });
      checks.check(
        `${label}: the ${w.mine} stays on the partner's ${w.theirs} (${misses.map((m: number): string => (m * 1000).toFixed(1)).join(", ")} mm)`,
        misses.every((m: number): boolean => m <= NEAR),
      );
      for (const subject of ["a", "b"] as const)
        checks.check(
          `${label}: ${subject} stays on the floor`,
          [from, act.end].every((t: number): boolean =>
            [...film.bones(subject, t).values()].every(
              (bone: IAutoMovieResolvedBone): boolean =>
                bone.worldPosition.y >= -FLOOR,
            ),
          ),
        );
      checks.check(
        `${label}: the ${w.mine} bears on the partner`,
        act.plan.contacts.some(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.support.kind === "person" && c.support.subject === "b",
        ),
      );
    } catch (error: unknown) {
      checks.check(`${String(w)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.check(
    "lying far from the partner is refused",
    (() => {
      try {
        scene(a, b, ways[0]!, 1.2).bones("a", 6);
        return false;
      } catch (error: unknown) {
        return error instanceof HumanRefusal && error.axis === "partner";
      }
    })(),
  );
  checks.assert("sleep lie together");
}

/**
 * Where a body's region lies, and which way it faces, once the body has lain
 * down alone from the origin at a heading, degrees.
 */
function lain(
  body: IAutoMovieMotionHumanBody,
  position: IAutoMovieMotionHumanLieDown.Position,
  name: AutoMovieHumanoidRegion,
  yaw: number = 0,
): ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> {
  const alone: HumanPerformance = new HumanPerformance({
    seed: "lie-alone",
    performers: [
      {
        subject: "x",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("x").lieDown({ kind: position, hold: 0.5 })
      .node,
  });
  return resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.regions[name],
    alone.bones("x", alone.duration).get(body.surfaces.regions[name].bone)!,
  );
}

/**
 * `b` lies down; `a` lies down `apart` from where it settles against `b`, then
 * they lie together.
 */
function scene(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  w: IWay,
  apart: number,
): HumanPerformance {
  // The partner lies from the origin; the performer is staged so that its
  // resting region lies `apart` from the partner's region across the floor.
  // Spooning, that is out from the partner's back, along its normal. With
  // the head on the chest, a chest's normal stands nearly upright on a body
  // lying on its back, so its level part points anywhere (mostly along the
  // body, which staged the performer over the partner's legs): the performer
  // is staged out to the partner's side instead, along the shoulders' axis
  // toward that chest, and lies down with its head toward the partner (a
  // body lying beside the partner along it puts its own trunk where the
  // partner's chest is, since a lying cheek is nearly on the body's midline).
  const theirs: ReturnType<typeof lain> = lain(b, w.partner, w.theirs);
  const out: IAutoMovieVector3 =
    w.way === "chest" ? side(b, w.partner, w.theirs) : flatten(theirs.normal);
  // A body lies down with its head behind its standing heading.
  const yaw: number =
    w.way === "chest" ? (Math.atan2(out.x, out.z) * 180) / Math.PI : 0;
  const mine: IAutoMovieVector3 = lain(a, w.own, w.mine, yaw).point;
  const offset: IAutoMovieVector3 = {
    x: theirs.point.x + out.x * apart - mine.x,
    y: 0,
    z: theirs.point.z + out.z * apart - mine.z,
  };
  return new HumanPerformance({
    seed: "lie-together",
    laws: [AutoMovieMotionHumanSleep.lieTogether],
    performers: [
      {
        subject: "a",
        body: a,
        at: offset,
        yaw,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    // The partner is placed first, so the performer reads where it lies.
    composition: HumanChain.subject("b")
      .lieDown({ kind: w.partner, hold: HOLD + 6 })
      .with(
        HumanChain.subject("a")
          // Lies down once the partner is down, so the two never cross on the way.
          .stand({ hold: 3 })
          .lieDown({ kind: w.own, hold: 0.5 })
          .registered(AutoMovieMotionHumanSleep.lieTogether.name, {
            partner: "b",
            way: w.way,
            hold: HOLD,
          }),
      ).node,
  });
}

/** A direction's level part, normalized. */
function flatten(v: IAutoMovieVector3): IAutoMovieVector3 {
  return Vector3.normalize({ x: v.x, y: 0, z: v.z });
}

/**
 * The level direction out to a lying body's side of a chest region, along its
 * shoulders' axis.
 */
function side(
  body: IAutoMovieMotionHumanBody,
  position: IAutoMovieMotionHumanLieDown.Position,
  chest: AutoMovieHumanoidRegion,
): IAutoMovieVector3 {
  const left: IAutoMovieVector3 = lain(body, position, "shoulderLeft").point;
  const right: IAutoMovieVector3 = lain(body, position, "shoulderRight").point;
  const leftward: IAutoMovieVector3 = flatten(Vector3.subtract(left, right));
  return chest === "chestLeft" ? leftward : Vector3.scale(leftward, -1);
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
