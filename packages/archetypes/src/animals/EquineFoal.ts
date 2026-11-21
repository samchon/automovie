import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeFrame,
  type ArchetypeRide,
} from "../core";
import { EquineExpression } from "./EquineExpression";
import type { EquineExpressionCue } from "./EquineExpressionCue";
import { EquineLiberty } from "./EquineLiberty";
import type { EquineLibertyCue } from "./EquineLibertyCue";
import { EquineRecumbency } from "./EquineRecumbency";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedRest } from "./QuadrupedRest";
import type { QuadrupedRestPlan } from "./QuadrupedRestPlan";
import { rideQuadruped } from "./rideQuadruped";

/** How often the mare's path is read for a following foal's course, seconds: authored. */
const STEP: number = 0.25;

/** Where a suckling foal stands, facing in at the udder: its centre's distance from the udder, metres, the degrees and radius of its turn in; its walking speed and its pause before reaching: authored. */
const NURSE: Readonly<INurseShape> = {
  out: 1.12,
  turn: 90,
  radius: 0.4,
  speed: 1,
  settle: 0.3,
  ease: 1,
};

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

/** The udder's place along the mare's trunk bar from its rear end, a share of the bar: authored. */
const UDDER: number = 0.3;

/** How far the udder hangs below the barrel's underside, metres: authored, the coarse body draws no udder. */
const HANG: number = 0.15;

/** A mare's lying for the foaling: everything but its start. */
type Lying = Omit<EquineRecumbency.ICue, "from">;

/** A named instant of a ride. */
type Instant = ArchetypeRide.IRide<string, string>["instants"][number];

/**
 * A mare and her foal: following at her flank, suckling, and the foaling.
 *
 * A following foal's course is the mare's own path read every `STEP` seconds and offset to her flank in her heading's frame, ridden as a timed course on the foal's own gait table, so its gait follows its speed as hers does. Suckling is a touching muzzle reach of the foal onto the mare's udder, read from her actual trunk bar: `HANG` below its underside at `UDDER` of the bar from the rear, the coarse body drawing no udder of its own. The foaling lies the mare down on her side with her limbs extended (`EquineRecumbency`); the newborn appears lying behind her at the delivery, rises through the shared sternal rest's rise and, once both stand, walks round to her flank, turns in to face her udder and makes its first suckling attempts. The offsets and the udder's place are authored.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how following, suckling and the foaling are staged and what is authored.
 * @evidence contracts/development/design.md#principled-representation Rides in, rides and cues out on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three entries and the udder reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rests and the reach are the shared ones.
 */
export namespace EquineFoal {
  /**
   * Where a following foal keeps to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metres in the mare's heading frame.
   * @evidence contracts/development/design.md#principled-representation A side, a lateral and a back offset.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `follow` takes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFollow {
    /** The mare's side it keeps to. */
    side: EquineExpressionCue.Side;

    /** Metres out from the mare's centre line. */
    out: number;

    /** Metres back from the mare's centre. */
    back: number;
  }

  /**
   * The foaling's timing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Film seconds and the rests the mare and foal play.
   * @evidence contracts/development/design.md#principled-representation A start, a delivery second, the rests and the suckling window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `foaling` takes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFoaling {
    /** Film second the mare starts lying down. */
    from: number;

    /** The mare's lateral recumbency, its side, transition and hold, her limbs extended. */
    mare: Lying;

    /** Film second the foal is delivered, while the mare lies on her side. */
    delivery: number;

    /** The foal's rest, whose rise it plays from lying. */
    foal: EquineLibertyCue.Rest;

    /** Metres behind the mare's centre the foal lies. */
    behind: number;

    /** The foal's first suckling attempts once it and the mare stand, if any. */
    suckle?: INurse;
  }

  /**
   * A newborn's first suckling: it walks to the mare's flank and reaches for her udder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side and the suckling's seconds.
   * @evidence contracts/development/design.md#principled-representation A side and a length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The foaling's optional suckling.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface INurse {
    /** The mare's side the foal suckles from. */
    side: EquineExpressionCue.Side;

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and output.
   * @evidence contracts/development/implementation.md#principled-implementation Read the mare's placement every `STEP`, offset it in her heading frame and ride the foal on that timed course.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sampled course, one ride.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(T / STEP) samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the quadruped ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ride retains its course.
   */
  export function follow<Id extends string, D extends string>(
    foal: Archetype<Id, D | QuadrupedBody.Dimension>,
    mare: ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension>,
    keep: IFollow,
  ): ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension> {
    /** The source dimensions with the quadruped size the ride solves. */
    type Dimension = D | QuadrupedBody.Dimension;
    const sign: number = keep.side === "left" ? 1 : -1;
    const samples: ArchetypeCourse.ISample[] = [];
    for (let k: number = 0; k * STEP <= mare.duration + 1e-9; k++) {
      const seconds: number = Math.min(mare.duration, k * STEP);
      const at: IAutoMovieTransform = mare.at(seconds).placement;
      const point: IAutoMovieVector3 = ArchetypeFrame.point(at, {
        x: sign * keep.out,
        y: 0,
        z: -keep.back,
      });
      samples.push({ seconds, x: point.x, z: point.z });
    }
    return rideQuadruped(foal, ArchetypeCourse.timed(foal.archetype, samples));
  }

  /**
   * The mare's udder in a sample, world metres: `HANG` below the underside of her trunk bar at `UDDER` of it from the rear.
   *
   * @param mare A sample of the mare.
   * @returns The udder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the construction.
   * @evidence contracts/development/implementation.md#principled-implementation The point on the bar's axis at the share, moved down by the bar's radius across the axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bar read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by suckling.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function udder<Id extends string, D extends string>(
    mare: ArchetypeRide.IPose<Id, D>,
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
    return ArchetypeFrame.point(
      mare.placement,
      Vector3.addScaled(centre, down, radius + HANG),
    );
  }

  /**
   * A foal's suckling: a touching muzzle reach onto the mare's udder over a window.
   *
   * @param mare The mare's ride.
   * @param window The suckling's window.
   * @returns The foal's expression cue.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the cue.
   * @evidence contracts/development/implementation.md#principled-implementation A tracked target on the mare's displayed udder, its course planned around her displayed body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cue.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One mare sample per foal sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the expression layer's reach.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The cue retains the mare's ride.
   */
  export function suckling<Id extends string, D extends string>(
    mare: ArchetypeRide.IRide<Id, D>,
    window: EquineExpressionCue.IWindow,
  ): EquineExpressionCue.IReach {
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
        at: (seconds: number): ArchetypeRide.IPose<Id, D> => mare.at(seconds),
      },
    };
  }

  /**
   * The foaling: the mare lies down on her side, the foal is delivered lying behind her and rises.
   *
   * @param mare The mare at rest.
   * @param ride The mare's ride, halted where she foals.
   * @param foal The newborn at rest.
   * @param timing The foaling's timing.
   * @returns The mare's ride and the foal's.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and outputs.
   * @evidence contracts/development/implementation.md#principled-implementation The mare's recline through the shared lateral rest; the foal's sternal rest played from lying at the delivery, placed behind the mare's halt.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two rides.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One clip each.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the liberty recline and the shared rest.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The rides retain their clips.
   */
  export function foaling<Id extends string, D extends string>(
    mare: Archetype<Id, D | QuadrupedBody.Dimension>,
    ride: ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension>,
    foal: Archetype<Id, D | QuadrupedBody.Dimension>,
    timing: IFoaling,
  ): readonly [
    ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension>,
    ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension>,
  ] {
    /** The source dimensions with the quadruped size the ride solves. */
    type Dimension = D | QuadrupedBody.Dimension;
    const lying: ArchetypeRide.IRide<Id, Dimension> = EquineRecumbency.after(
      mare,
      ride,
      { from: timing.from, ...timing.mare },
    );
    const halt: ArchetypeRide.ISample<Id, Dimension> = ride.at(ride.duration);
    const place: IAutoMovieTransform = {
      ...halt.placement,
      translation: ArchetypeFrame.point(halt.placement, {
        x: 0,
        y: 0,
        z: -timing.behind,
      }),
    };
    const clip: QuadrupedRestPlan.IClip<Id, Dimension> = QuadrupedRest(
      foal,
      EquineLiberty.rested(foal, place, timing.foal),
    );
    const down: number = clip.events.bellyOn;
    const at = (seconds: number): ArchetypeRide.ISample<Id, Dimension> => {
      const shown: QuadrupedRestPlan.ISample<Id, Dimension> = clip.sample(
        Math.min(clip.duration, down + Math.max(0, seconds - timing.delivery)),
      );
      return {
        archetype: shown.animal,
        // A sternal rest poses its parts in place.
        placement: ArchetypeFrame.copy(place),
        course: ride.plan.at(Math.min(seconds, ride.duration)),
      };
    };
    const born: ArchetypeRide.IRide<Id, Dimension> = {
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
        const sample: ArchetypeRide.ISample<Id, Dimension> = at(seconds);
        return ArchetypeFrame.compose(
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

  /** The risen foal walks to the risen mare's flank and suckles: an S-curve of two opposite quarter turns steps it across, a straight brings it level with the udder, and a last turn faces it in at the udder from beside the barrel, where it reaches up under the belly. */
  function nursed<Id extends string, D extends string>(
    foal: Archetype<Id, D | QuadrupedBody.Dimension>,
    born: ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension>,
    lying: ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension>,
    nurse: INurse,
  ): ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension> {
    /** The source dimensions with the quadruped size the ride solves. */
    type Dimension = D | QuadrupedBody.Dimension;
    const both: number = Math.max(born.duration, lying.duration);
    const stood: ArchetypeRide.ISample<Id, Dimension> = born.at(born.duration);
    const mare: ArchetypeRide.ISample<Id, Dimension> = lying.at(lying.duration);
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
    const approach: ArchetypeRide.IRide<Id, Dimension> = rideQuadruped(
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
    const at = (seconds: number): ArchetypeRide.ISample<Id, Dimension> =>
      seconds < both ? born.at(seconds) : approach.at(seconds - both);
    const walked: ArchetypeRide.IRide<Id, Dimension> = {
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
        const sample: ArchetypeRide.ISample<Id, Dimension> = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
    // It walks up with its head lowered, then reaches from that carriage up to the udder, its course planned around the mare.
    const arrive: number = walked.duration + NURSE.settle;
    return EquineExpression.layer(foal, walked, [
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
