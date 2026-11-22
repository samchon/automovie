import type { IAutoMovieTransform } from "@automovie/interface";

import type { AutoMovieArchetype, AutoMovieArchetypeCourse } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * The authored inputs, the displayed samples and the stroke coordination of an equid's water crossing (`AutoMovieArchetypeEquineFord`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the crossing's inputs, its phases, events and samples, and the authored limb coordination.
 * @evidence contracts/development/design.md#principled-representation World metres, seconds and degrees with closed phase and event unions; the water is one horizontal height and the ground authored planes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned beside `AutoMovieArchetypeEquineFord`, its only producer; read by its callers and the rider's crossing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No inferred terrain or water; every height is the author's.
 */
export namespace AutoMovieArchetypeEquineFordPlan {
  /**
   * The crossing's displayed segment: grounded wading, the cut into the swim, the swim, the cut onto the bank and grounded climbing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each segment in film order.
   * @evidence contracts/development/design.md#principled-representation A closed union of the five segments of one clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carried by each sample for its readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Phase =
    | "wading"
    | "floating"
    | "swimming"
    | "landing"
    | "climbing";

  /**
   * The named contact changes: the hooves leave the ford's bed, the stroke is established, the hooves meet the far bank, and the climbing footholds hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each contact change.
   * @evidence contracts/development/design.md#principled-representation A closed union keyed to film seconds by the clip.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The four boundaries the clip's segments share.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Event = "float" | "swim" | "land" | "climb";

  /**
   * One labelled film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the label's meaning.
   * @evidence contracts/development/design.md#principled-representation A film second and its label, the form every ride's instants take.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The clip's instant list.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IInstant {
    /** Film seconds. */
    seconds: number;
    /** A hoof landing such as `leftForeOn`, a stroke start such as `leftForeStroke`, or an `Event`. */
    label: string;
  }

  /**
   * A grounded course on the footing whose swim-side speed the crossing owns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and the default speed.
   * @evidence contracts/development/design.md#principled-representation A ride course without its start, footing or swim-side speed, which the crossing supplies.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The wading and the climbing share it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The swim-side speed cannot be authored twice.
   */
  export interface IGrounded {
    /** The legs in order, at least one; a leg's rise follows a graded bed. */
    legs: readonly rideQuadruped.ILeg[];
    /** The cruising speed, metres per second. */
    cruise: number;
    /** The acceleration, metres per second squared, where the course speeds up. */
    acceleration?: number;
    /** The braking, metres per second squared, where the course slows. */
    deceleration?: number;
    /** The speed at the course's dry end, metres per second: the wading's start speed, the climbing's end speed; 0 when absent. */
    speed?: number;
    /** The gait of every stride; the speed chooses it when absent. */
    gait?: AutoMovieArchetypeQuadrupedGait.Gait;
  }

  /**
   * The authored swim: its carriage and its timing. The cited studies measured a swimming speed of 1.1 m/s and fore and hind cycles of 1.1 and 1.2 s (forelimb and hindlimb studies, Table 1); one cycle serves both ends here.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and sign.
   * @evidence contracts/development/design.md#principled-representation Positive length, speed and cycle and finite immersion and raise; `AutoMovieArchetypeEquineFord` refuses others.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the swim segment reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default from the studies is applied silently.
   */
  export interface ISwim {
    /** The straight distance swum, metres, positive. */
    length: number;
    /** The swimming speed, metres per second, positive; also the wading's end speed and the climbing's start speed. */
    speed: number;
    /** One stroke cycle, seconds, positive. */
    cycle: number;
    /** The neutral back's depth below the water while floating, metres; negative above it. */
    immersion: number;
    /** The neck's raise above its neutral carriage, degrees. */
    neck: number;
  }

  /**
   * The crossing: the water, its banks and beds, and the three segments.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and role.
   * @evidence contracts/development/design.md#principled-representation World heights in metres, the start as a course's, and a positive decay in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `AutoMovieArchetypeEquineFord` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** The water's surface height, world metres. */
    water: number;
    /** Every bed and bank, as authored world planes. */
    footing: AutoMovieArchetypeQuadrupedFooting.IScene;
    /** Where the wading starts and its heading, as a course's start; the ground under it is the wading course's datum. */
    start: AutoMovieArchetypeCourse.ICourse["start"];
    /** The grounded wading down the ford. */
    entry: IGrounded;
    /** The swim. */
    swim: ISwim;
    /** The grounded climbing out from where the swim ends, on its heading; the ground under its start is its datum. */
    recovery: IGrounded;
    /** Each cut's inertialization decay, seconds, positive. */
    transition: number;
  }

  /**
   * One displayed second of the crossing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the model's space and the placement.
   * @evidence contracts/development/design.md#principled-representation A posed model in its placement's model space and that world placement, the form every ride sample takes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by the clip's sampler.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISample<Id extends string, D extends string> {
    /** The animal in its pose, in the placement's model space. */
    archetype: AutoMovieArchetype<Id, D>;
    /** The animal's placement in the world. */
    placement: IAutoMovieTransform;
    /** The segment shown. */
    phase: Phase;
  }

  /**
   * A crossing sampled by film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the duration, events, instants and the sampler's domain.
   * @evidence contracts/development/design.md#principled-representation A pure function of film seconds with the clock's boundaries as data.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `AutoMovieArchetypeEquineFord`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No playback state.
   */
  export interface IClip<Id extends string, D extends string> {
    /** The film second the climbing ends. */
    duration: number;
    /** The named contact changes, film seconds. */
    events: Readonly<Record<Event, number>>;
    /** Every named instant in time order: the rides' hoof landings, the contact changes and each stroke's start. */
    instants: readonly IInstant[];
    /**
     * The crossing at a film second; before 0 the wading's start and after the end the climbing's end.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit, the held ends and the fresh sample.
     * @evidence contracts/development/implementation.md#principled-implementation The grounded ride's sample, or the closed-form swim pose, blended over a cut and lifted by its bed depth.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the segment by the film second, then one pose and one emission.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every floating second is verified against the footing; nothing is interpolated from other samples.
     * @evidence contracts/development/implementation.md#efficient-algorithms One ride sample, or one O(B) pose plus one emission and an O(P·S) footing check.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the prepared rides, rig and offsets.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh model and retains nothing.
     */
    sample: (seconds: number) => ISample<Id, D>;
  }

  /** Each limb's stroke phase offset, cycles: the diagonal pairs half a cycle apart, a trot-like coordination authored for the take, since both cited studies filmed only the left limbs. */
  export const PHASES: Readonly<
    Record<AutoMovieArchetypeQuadrupedBody.Limb, number>
  > = {
    leftFore: 0,
    rightHind: 0,
    rightFore: 0.5,
    leftHind: 0.5,
  };
}
