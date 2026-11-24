import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
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
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";

import type { motionComplaints } from "../../features/internal/motionComplaints";
import { motionActionUnit } from "./motionActionUnit";

/**
 * Lying together of `test_motion_sleep_lie_together`, staged as that spec
 * stages it, with its checks 1 to 3 for one way, so each way, the lying down
 * and the refusal are units of their own.
 */
export namespace lieTogetherScene {
  /** One way of lying together and the regions it brings together. */
  export interface IWay {
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

  /** Spooning: both on the left side, the chest on the partner's upper back. */
  export const SPOON: IWay = {
    way: "spoon",
    partner: "lateralLeft",
    own: "lateralLeft",
    mine: "sternum",
    theirs: "upperBack",
  };

  /**
   * The head on the chest: the partner on its back, the performer's lower cheek
   * on its chest.
   */
  export const CHEST: IWay = {
    way: "chest",
    partner: "supine",
    own: "lateralRight",
    mine: "cheekRight",
    theirs: "chestLeft",
  };

  /**
   * How near the resting region stays to the partner's, metres: the law's skin
   * contact and its rest gap.
   */
  const NEAR: number = 0.015;

  /**
   * How far below the floor any bone may lie, metres: the verdicts' floor
   * tolerance, read on the joints (provisional).
   */
  export const FLOOR: number = 0.01;

  /** How long the two lie together, seconds. */
  const HOLD: number = 3;

  /**
   * How far from its settled place the performer is staged to lie, metres:
   * clear of the partner while lying down, within the settling arm's reach.
   */
  export const NEARBY: number = 0.6;

  /**
   * Where a body's region lies, and which way it faces, once the body has lain
   * down alone from the origin at a heading, degrees.
   */
  export function lain(
    body: IAutoMovieMotionHumanBody,
    position: IAutoMovieMotionHumanLieDown.Position,
    name: AutoMovieHumanoidRegion,
    yaw: number = 0,
  ): ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> {
    const alone: HumanPerformance = lieAlone(body, position, yaw);
    return resolveAutoMovieHumanoidSurfaces.place(
      body.surfaces.regions[name],
      alone.bones("x", alone.duration).get(body.surfaces.regions[name].bone)!,
    );
  }

  /**
   * A body lying down alone from the origin at a heading, held 0.5 s, as the
   * original reads each body's lying place.
   */
  export function lieAlone(
    body: IAutoMovieMotionHumanBody,
    position: IAutoMovieMotionHumanLieDown.Position,
    yaw: number = 0,
  ): HumanPerformance {
    return new HumanPerformance({
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
      composition: HumanChain.subject("x").lieDown({
        kind: position,
        hold: 0.5,
      }).node,
    });
  }

  /**
   * `b` lies down; `a` lies down `apart` from where it settles against `b`,
   * then they lie together.
   */
  export function scene(
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
    w: IWay,
    apart: number,
  ): HumanPerformance {
    // The partner lies from the origin; the performer is staged so that its
    // resting region lies `apart` from the partner's region across the floor:
    // spooning, out from the partner's back along its normal; with the head
    // on the chest, out to the partner's side along the shoulders' axis, its
    // head toward the partner, as the original stages it.
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

      // The partner is placed first, so the performer reads where it lies;
      // the performer lies down once the partner is down, so the two never
      // cross on the way.
      composition: HumanChain.subject("b")
        .lieDown({ kind: w.partner, hold: HOLD + 6 })
        .with(
          HumanChain.subject("a")
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

  /**
   * One way's lying together with the original's checks 1 to 3 and its own
   * bounds.
   */
  export function verify(
    checks: motionComplaints.IGatherer,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
    w: IWay,
  ): void {
    const label: string = `m-average and f-small lie together (${w.way})`;
    const film: HumanPerformance = scene(a, b, w, NEARBY);
    const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
      film,
      "a",
      "lieTogether",
    );
    const from: number = motionActionUnit.event(act, "settled");

    // Spooning, each midline stands at its own lying height: the resting
    // point is the partner's region raised by the two bodies' difference in
    // that height, read from each lying alone.
    const raised: number =
      w.way === "spoon"
        ? lain(a, w.own, w.mine).point.y - lain(b, w.partner, w.theirs).point.y
        : 0;

    // With the head on the chest, the cheek rests on the partner's surface
    // by the shoulder, read against the partner's colliders.
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
    motionActionUnit.bounds(checks, label, film, "a", act);
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
    const right: IAutoMovieVector3 = lain(
      body,
      position,
      "shoulderRight",
    ).point;
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
}
