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
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  lieTogether,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** How near the resting region stays to the partner's, metres: the law's skin contact and its rest gap. */
const NEAR: number = 0.015;

/** How far below the floor any bone may lie, metres: the verdicts' floor tolerance, read on the joints (provisional). */
const FLOOR: number = 0.01;

/** How long the two lie together, seconds. */
const HOLD: number = 3;

/** How far from its settled place the performer is staged to lie, metres: clear of the partner while lying down, within the settling arm's reach. */
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
 * Lying together on the floor (#4012): spooning, and the head on the
 * partner's chest.
 *
 * Scenarios, the average man with the small woman for each way, each take
 * clean:
 * 1. Through the hold, the performer's chest lies on the partner's back
 *    (spooning, at the height the performer's own lying width gives its
 *    midline) or its lower cheek on the partner's chest, as the partner
 *    breathes.
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
export function test_human_motion_lie_together(): void {
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
    const label: string = `m-average and f-small lie together (${w.way})`;
    const film: HumanPerformance = scene(a, b, w, NEARBY);
    assertTakeClean(label, film);
    const act: IAutoMovieMotionHumanSegment = film
      .segments("a")
      .find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "lieTogether",
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
        ? lain(a, w.own, w.mine).point.y - lain(b, w.partner, w.theirs).point.y
        : 0;
    const misses: readonly number[] = [0, 0.5, 1].map((k: number): number => {
      const t: number = from + k * (act.end - from);
      const theirs: IAutoMovieVector3 = region(film, "b", b, w.theirs, t);
      return Vector3.distance(region(film, "a", a, w.mine, t), {
        ...theirs,
        y: theirs.y + raised,
      });
    });
    TestValidator.predicate(
      `${label}: the ${w.mine} stays on the partner's ${w.theirs} (${misses.map((m: number): string => (m * 1000).toFixed(1)).join(", ")} mm)`,
      misses.every((m: number): boolean => m <= NEAR),
    );
    for (const subject of ["a", "b"] as const)
      TestValidator.predicate(
        `${label}: ${subject} stays on the floor`,
        [from, act.end].every((t: number): boolean =>
          [...film.bones(subject, t).values()].every(
            (bone: IAutoMovieResolvedBone): boolean =>
              bone.worldPosition.y >= -FLOOR,
          ),
        ),
      );
    TestValidator.predicate(
      `${label}: the ${w.mine} bears on the partner`,
      act.plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.support.kind === "person" && c.support.subject === "b",
      ),
    );
  }
  TestValidator.predicate(
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
}

/** Where a body's region lies, and which way it faces, once the body has lain down alone from the origin. */
function lain(
  body: IAutoMovieMotionHumanBody,
  position: IAutoMovieMotionHumanLieDown.Position,
  name: AutoMovieHumanoidRegion,
): ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> {
  const alone: HumanPerformance = new HumanPerformance({
    seed: "lie-alone",
    performers: [
      {
        subject: "x",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
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

/** `b` lies down; `a` lies down `apart` from where it settles against `b`, then they lie together. */
function scene(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  w: IWay,
  apart: number,
): HumanPerformance {
  // The partner lies from the origin; the performer is staged so that its
  // resting region lies `apart` from the partner's region across the floor.
  const theirs: ReturnType<typeof lain> = lain(b, w.partner, w.theirs);
  const mine: IAutoMovieVector3 = lain(a, w.own, w.mine).point;
  const out: IAutoMovieVector3 = Vector3.normalize({
    x: theirs.normal.x,
    y: 0,
    z: theirs.normal.z,
  });
  const offset: IAutoMovieVector3 = {
    x: theirs.point.x + out.x * apart - mine.x,
    y: 0,
    z: theirs.point.z + out.z * apart - mine.z,
  };
  return new HumanPerformance({
    seed: "lie-together",
    laws: [lieTogether],
    performers: [
      {
        subject: "a",
        body: a,
        at: offset,
        yaw: 0,
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
          .registered(lieTogether.name, {
            partner: "b",
            way: w.way,
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
