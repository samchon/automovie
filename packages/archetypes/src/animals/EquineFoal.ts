import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeFrame,
  type ArchetypeRide,
} from "../core";
import type { EquineExpressionCue } from "./EquineExpressionCue";
import { EquineLiberty } from "./EquineLiberty";
import type { EquineLibertyCue } from "./EquineLibertyCue";
import { QuadrupedRest } from "./QuadrupedRest";
import type { QuadrupedRestPlan } from "./QuadrupedRestPlan";
import { rideQuadruped } from "./rideQuadruped";

/** How often the mare's path is read for a following foal's course, seconds: authored. */
const STEP: number = 0.25;

/** The udder's place along the mare's trunk bar from its rear end, a share of the bar: authored. */
const UDDER: number = 0.15;

/** A named instant of a ride. */
type Instant = ArchetypeRide.IRide<string, string>["instants"][number];

/**
 * A mare and her foal: following at her flank, suckling, and the foaling.
 *
 * A following foal's course is the mare's own path read every `STEP` seconds and offset to her flank in her heading's frame, ridden as a timed course on the foal's own gait table, so its gait follows its speed as hers does. Suckling is a touching muzzle reach of the foal onto the mare's udder, read from her actual trunk bar: its underside at `UDDER` of the bar from the rear. The foaling plays the mare down into lateral recumbency through the shared lateral rest; the newborn appears lying behind her at the delivery, rises through the shared sternal rest's rise and then suckles. The offsets and the udder's place are authored.
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

    /** The mare's rest and her lateral roll, the limbs extended. */
    mare: Pick<EquineLibertyCue.IRecline, "rest" | "lateral">;

    /** Film second the foal is delivered, while the mare lies on her side. */
    delivery: number;

    /** The foal's rest, whose rise it plays from lying. */
    foal: EquineLibertyCue.Rest;

    /** Metres behind the mare's centre the foal lies. */
    behind: number;
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
    foal: Archetype<Id, D>,
    mare: ArchetypeRide.IRide<Id, D>,
    keep: IFollow,
  ): ArchetypeRide.IRide<Id, D> {
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
   * The mare's udder in a sample, world metres: the underside of her trunk bar at `UDDER` of it from the rear.
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
      Vector3.addScaled(centre, down, radius),
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
   * @evidence contracts/development/implementation.md#principled-implementation A tracked target on the mare's displayed udder.
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
    mare: Archetype<Id, D>,
    ride: ArchetypeRide.IRide<Id, D>,
    foal: Archetype<Id, D>,
    timing: IFoaling,
  ): readonly [ArchetypeRide.IRide<Id, D>, ArchetypeRide.IRide<Id, D>] {
    const lying: ArchetypeRide.IRide<Id, D> = EquineLiberty.after(
      mare,
      ride,
      [],
      { from: timing.from, ...timing.mare },
    );
    const halt: ArchetypeRide.ISample<Id, D> = ride.at(ride.duration);
    const place: IAutoMovieTransform = {
      ...halt.placement,
      translation: ArchetypeFrame.point(halt.placement, {
        x: 0,
        y: 0,
        z: -timing.behind,
      }),
    };
    const clip: QuadrupedRestPlan.IClip<Id, D> = QuadrupedRest(
      foal,
      EquineLiberty.rested(foal, place, timing.foal),
    );
    const down: number = clip.events.bellyOn;
    const at = (seconds: number): ArchetypeRide.ISample<Id, D> => {
      const shown: QuadrupedRestPlan.ISample<Id, D> = clip.sample(
        Math.min(clip.duration, down + Math.max(0, seconds - timing.delivery)),
      );
      return {
        archetype: shown.animal,
        // A sternal rest poses its parts in place.
        placement: ArchetypeFrame.copy(place),
        course: ride.plan.at(Math.min(seconds, ride.duration)),
      };
    };
    const born: ArchetypeRide.IRide<Id, D> = {
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
        const sample: ArchetypeRide.ISample<Id, D> = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
    return [lying, born];
  }
}
