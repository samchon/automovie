import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeRide,
} from "../core";
import { AutoMovieArchetypeEquineExpression } from "./AutoMovieArchetypeEquineExpression";
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import { AutoMovieArchetypeEquineLiberty } from "./AutoMovieArchetypeEquineLiberty";
import type { AutoMovieArchetypeEquineLibertyCue } from "./AutoMovieArchetypeEquineLibertyCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedRest } from "./AutoMovieArchetypeQuadrupedRest";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "./AutoMovieArchetypeQuadrupedRestPlan";
import { EquineRecumbency } from "./equine/EquineRecumbency";
import { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * How often the mare's path is read for a following foal's course, seconds:
 * authored.
 */
const STEP: number = 0.25;

/**
 * Where a suckling foal stands, facing in at the udder: its centre's distance
 * from the udder, metres, the degrees and radius of its turn in; its walking
 * speed and its pause before reaching: authored.
 */
const NURSE: Readonly<INurseShape> = {
  out: 1.12,
  turn: 90,
  radius: 0.4,
  speed: 1,
  settle: 0.3,
  ease: 1,
};

/**
 * The udder's place along the mare's trunk bar from its rear end, a share of
 * the bar: authored.
 */
const UDDER: number = 0.3;

/**
 * How far the udder hangs below the barrel's underside, metres: authored, the
 * coarse body draws no udder.
 */
const HANG: number = 0.15;

/**
 * A mare and her foal: following at her flank, suckling, and the foaling.
 *
 * A following foal's course is the mare's own path read every `STEP` seconds
 * and offset to her flank in her heading's frame, ridden as a timed course on
 * the foal's own gait table, so its gait follows its speed as hers does.
 * Suckling is a touching muzzle reach of the foal onto the mare's udder, read
 * from her trunk bar: `HANG` below its underside at `UDDER` of the bar from the
 * rear, the coarse body drawing no udder of its own. The foaling lies the mare
 * down on her side with her limbs extended (`EquineRecumbency`); the newborn
 * appears lying behind her at the delivery, rises through the shared sternal
 * rest's rise and, once both stand, walks round to her flank, turns in to face
 * her udder and makes its first suckling attempts. The offsets and the udder's
 * place are authored.
 */
export namespace AutoMovieArchetypeEquineFoal {
  /** Where a following foal keeps to. */
  export interface IFollow {
    /** The mare's side it keeps to. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** Metres out from the mare's centre line. */
    out: number;

    /** Metres back from the mare's centre. */
    back: number;
  }

  /** The foaling's timing. */
  export interface IFoaling {
    /** Film second the mare starts lying down. */
    from: number;

    /**
     * The mare's lateral recumbency, its side, transition and hold, her limbs
     * extended.
     */
    mare: Lying;

    /** Film second the foal is delivered, while the mare lies on her side. */
    delivery: number;

    /** The foal's rest, whose rise it plays from lying. */
    foal: AutoMovieArchetypeEquineLibertyCue.Rest;

    /** Metres behind the mare's centre the foal lies. */
    behind: number;

    /** The foal's first suckling attempts once it and the mare stand, if any. */
    suckle?: INurse;
  }

  /**
   * A newborn's first suckling: it walks to the mare's flank and reaches for
   * her udder.
   */
  export interface INurse {
    /** The mare's side the foal suckles from. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** Seconds the suckling lasts once the muzzle is on the udder. */
    seconds: number;
  }

  /**
   * A foal's ride following a mare.
   *
   * @param foal The foal at rest.
   * @param mare The mare's ride.
   * @param keep Where the foal keeps to.
   * @returns The foal's ride over the mare's duration.
   */
  export function follow<Id extends string, D extends string>(
    foal: AutoMovieArchetype<Id, D | AutoMovieArchetypeQuadrupedBody.Dimension>,
    mare: AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    keep: IFollow,
  ): AutoMovieArchetypeRide.IRide<
    Id,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  > {
    const sign: number = keep.side === "left" ? 1 : -1;
    const samples: AutoMovieArchetypeCourse.ISample[] = [];
    for (let k: number = 0; k * STEP <= mare.duration + 1e-9; k++) {
      const seconds: number = Math.min(mare.duration, k * STEP);
      const at: IAutoMovieTransform = mare.at(seconds).placement;
      const point: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(at, {
        x: sign * keep.out,
        y: 0,
        z: -keep.back,
      });
      samples.push({ seconds, x: point.x, z: point.z });
    }
    return AutoMovieArchetypeQuadruped.ride(
      foal,
      AutoMovieArchetypeCourse.timed(foal.archetype, samples),
    );
  }

  /**
   * The mare's udder in a sample, world metres: `HANG` below the underside of
   * her trunk bar at `UDDER` of it from the rear.
   *
   * @param mare A sample of the mare.
   * @returns The udder.
   */
  export function udder<Id extends string, D extends string>(
    mare: AutoMovieArchetypeRide.IPose<Id, D>,
  ): IAutoMovieVector3 {
    const trunk: IAutoMovieModelPart = mare.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "trunk",
    )!;
    const height: number =
      trunk.geometry.type === "primitive" &&
      trunk.geometry.shape.type === "capsule"
        ? trunk.geometry.shape.height
        : 0;
    const radius: number =
      trunk.geometry.type === "primitive" &&
      trunk.geometry.shape.type === "capsule"
        ? trunk.geometry.shape.radius
        : 0;
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      trunk.transform!.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const rear: IAutoMovieVector3 = Vector3.addScaled(
      trunk.transform!.translation,
      axis,
      -height / 2,
    );
    const centre: IAutoMovieVector3 = Vector3.addScaled(
      rear,
      axis,
      UDDER * height,
    );
    const down: IAutoMovieVector3 = Vector3.normalize(
      Vector3.addScaled({ x: 0, y: -1, z: 0 }, axis, axis.y),
    );
    return AutoMovieArchetypeFrame.point(
      mare.placement,
      Vector3.addScaled(centre, down, radius + HANG),
    );
  }

  /**
   * A foal's suckling: a touching muzzle reach onto the mare's udder over a
   * window.
   *
   * @param mare The mare's ride.
   * @param window The suckling's window.
   * @returns The foal's expression cue.
   */
  export function suckling<Id extends string, D extends string>(
    mare: AutoMovieArchetypeRide.IRide<Id, D>,
    window: AutoMovieArchetypeEquineExpressionCue.IWindow,
  ): AutoMovieArchetypeEquineExpressionCue.IReach {
    return {
      kind: "reach",
      act: "suckle",
      gap: 0,
      ...window,
      target: {
        kind: "track",
        at: (seconds: number): IAutoMovieVector3 => udder(mare.at(seconds)),
      },
      around: {
        at: (seconds: number): AutoMovieArchetypeRide.IPose<Id, D> =>
          mare.at(seconds),
      },
    };
  }

  /**
   * The foaling: the mare lies down on her side, the foal is delivered lying
   * behind her and rises.
   *
   * @param mare The mare at rest.
   * @param ride The mare's ride, halted where she foals.
   * @param foal The newborn at rest.
   * @param timing The foaling's timing.
   * @returns The mare's ride and the foal's.
   */
  export function foaling<Id extends string, D extends string>(
    mare: AutoMovieArchetype<Id, D | AutoMovieArchetypeQuadrupedBody.Dimension>,
    ride: AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    foal: AutoMovieArchetype<Id, D | AutoMovieArchetypeQuadrupedBody.Dimension>,
    timing: IFoaling,
  ): readonly [
    AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
  ] {
    /** The source dimensions with the quadruped size the ride solves. */
    type Dimension = D | AutoMovieArchetypeQuadrupedBody.Dimension;
    const lying: AutoMovieArchetypeRide.IRide<Id, Dimension> =
      EquineRecumbency.after(mare, ride, { from: timing.from, ...timing.mare });
    const halt: AutoMovieArchetypeRide.ISample<Id, Dimension> = ride.at(
      ride.duration,
    );
    const place: IAutoMovieTransform = {
      ...halt.placement,
      translation: AutoMovieArchetypeFrame.point(halt.placement, {
        x: 0,
        y: 0,
        z: -timing.behind,
      }),
    };
    const clip: AutoMovieArchetypeQuadrupedRestPlan.IClip<Id, Dimension> =
      AutoMovieArchetypeQuadrupedRest.plan(
        foal,
        AutoMovieArchetypeEquineLiberty.rested(foal, place, timing.foal),
      );
    const down: number = clip.events.bellyOn;
    const at = (
      seconds: number,
    ): AutoMovieArchetypeRide.ISample<Id, Dimension> => {
      const shown: AutoMovieArchetypeQuadrupedRestPlan.ISample<Id, Dimension> =
        clip.sample(
          Math.min(
            clip.duration,
            down + Math.max(0, seconds - timing.delivery),
          ),
        );
      return {
        archetype: shown.animal,
        // A sternal rest poses its parts in place.
        placement: AutoMovieArchetypeFrame.copy(place),
        course: ride.plan.at(Math.min(seconds, ride.duration)),
      };
    };
    const born: AutoMovieArchetypeRide.IRide<Id, Dimension> = {
      plan: ride.plan,
      duration: timing.delivery + clip.duration - down,
      instants: [
        { seconds: timing.delivery, label: "foal:delivered" },
        ...Object.entries(clip.events)
          .filter(([, seconds]: [string, number]): boolean => seconds > down)
          .map(
            ([label, seconds]: [string, number]): Instant => ({
              label: `rest:${label}`,
              seconds: timing.delivery + seconds - down,
            }),
          ),
      ],
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, Dimension> =
          at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
    return [
      lying,
      timing.suckle === undefined
        ? born
        : nursed(foal, born, lying, timing.suckle),
    ];
  }

  /**
   * The risen foal walks to the risen mare's flank and suckles: an S-curve of
   * two opposite quarter turns steps it across, a straight brings it level with
   * the udder, and a last turn faces it in at the udder from beside the barrel,
   * where it reaches up under the belly.
   */
  function nursed<Id extends string, D extends string>(
    foal: AutoMovieArchetype<Id, D | AutoMovieArchetypeQuadrupedBody.Dimension>,
    born: AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    lying: AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    nurse: INurse,
  ): AutoMovieArchetypeRide.IRide<
    Id,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  > {
    /** The source dimensions with the quadruped size the ride solves. */
    type Dimension = D | AutoMovieArchetypeQuadrupedBody.Dimension;
    const both: number = Math.max(born.duration, lying.duration);
    const stood: AutoMovieArchetypeRide.ISample<Id, Dimension> = born.at(
      born.duration,
    );
    const mare: AutoMovieArchetypeRide.ISample<Id, Dimension> = lying.at(
      lying.duration,
    );
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      mare.placement.rotation,
    );
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, mare.placement.translation),
      );
    const teat: IAutoMovieVector3 = local(udder(mare));
    const from: IAutoMovieVector3 = local(stood.placement.translation);
    // Its last turn of `NURSE.turn` faces it in at the udder from `NURSE.out` out, clear of the barrel and the hind leg; the S-curve of two quarter turns before it steps it across and a straight brings it up.
    const outward: number = nurse.side === "left" ? 1 : -1;
    const turn: number = (NURSE.turn * Math.PI) / 180;
    const facing: IAutoMovieVector3 = {
      x: -outward * Math.sin(turn),
      y: 0,
      z: Math.cos(turn),
    };
    const centre: IAutoMovieVector3 = Vector3.addScaled(
      teat,
      facing,
      -NURSE.out,
    );
    const before: IAutoMovieVector3 = {
      x: centre.x + outward * NURSE.radius * (1 - Math.cos(turn)),
      y: 0,
      z: centre.z - NURSE.radius * Math.sin(turn),
    };
    const across: number = before.x - from.x;
    const radius: number = Math.abs(across) / 2;
    const straight: number = before.z - from.z - 2 * radius;
    if (!(straight >= 0))
      throw new RangeError(
        "The foal stands too near the udder to walk round to the flank",
      );
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
      stood.placement.rotation,
      { x: 0, y: 0, z: 1 },
    );
    const sign: number = across >= 0 ? 1 : -1;
    const approach: AutoMovieArchetypeRide.IRide<Id, Dimension> = AutoMovieArchetypeQuadruped.ride(
      foal,
      {
        start: {
          x: stood.placement.translation.x,
          z: stood.placement.translation.z,
          heading: (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI,
        },
        cruise: NURSE.speed,
        startSpeed: 0,
        endSpeed: 0,
        acceleration: 2,
        deceleration: 2,
        startFromStanding: true,
        legs: [
          { kind: "turn", radius, angle: sign * 90 },
          { kind: "turn", radius, angle: -sign * 90 },
          ...(straight > 0
            ? [{ kind: "straight" as const, length: straight }]
            : []),
          { kind: "turn", radius: NURSE.radius, angle: -outward * NURSE.turn },
        ],
      },
      "walk",
    );
    const at = (
      seconds: number,
    ): AutoMovieArchetypeRide.ISample<Id, Dimension> =>
      seconds < both ? born.at(seconds) : approach.at(seconds - both);
    const walked: AutoMovieArchetypeRide.IRide<Id, Dimension> = {
      plan: born.plan,
      duration: both + approach.duration,
      instants: [
        ...born.instants,
        ...approach.instants.map(
          (instant: Instant): Instant => ({
            ...instant,
            seconds: instant.seconds + both,
          }),
        ),
      ],
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, Dimension> =
          at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
    // It walks up with its head lowered, then reaches from that carriage up to the udder, its course planned around the mare.
    const arrive: number = walked.duration + NURSE.settle;
    return AutoMovieArchetypeEquineExpression.layer(foal, walked, [
      {
        kind: "carriage",
        carriage: "doze",
        from: both,
        to: arrive,
        ease: Math.min(NURSE.ease, (arrive - both) / 4),
      },
      suckling(lying, {
        from: arrive,
        to: arrive + 2 * NURSE.ease + nurse.seconds,
        ease: NURSE.ease,
      }),
    ]);
  }
}

/** A suckling foal's authored place. */
interface INurseShape {
  /** Metres out from the mare's centre line. */
  out: number;

  /** Degrees of its last turn in, from the mare's heading. */
  turn: number;

  /** Metres of radius of its last turn in. */
  radius: number;

  /** Its walking speed, metres per second. */
  speed: number;

  /** Seconds it settles before reaching. */
  settle: number;

  /** Seconds its reach eases in and out. */
  ease: number;
}

/** A mare's lying for the foaling: everything but its start. */
type Lying = Omit<EquineRecumbency.ICue, "from">;

/** A named instant of a ride. */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];
