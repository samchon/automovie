import type { IAutoMovieTransform } from "@automovie/interface";

import type { AutoMovieArchetype, AutoMovieArchetypeCourse } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * The authored inputs, the displayed samples and the stroke coordination of an
 * equid's water crossing (`AutoMovieArchetypeEquineFord`).
 */
export namespace AutoMovieArchetypeEquineFordPlan {
  /**
   * The crossing's displayed segment: grounded wading, the cut into the swim,
   * the swim, the cut onto the bank and grounded climbing.
   */
  export type Phase =
    | "wading"
    | "floating"
    | "swimming"
    | "landing"
    | "climbing";

  /**
   * The named contact changes: the hooves leave the ford's bed, the stroke is
   * established, the hooves meet the far bank, and the climbing footholds
   * hold.
   */
  export type Event = "float" | "swim" | "land" | "climb";

  /** One labelled film second. */
  export interface IInstant {
    /** Film seconds. */
    seconds: number;
    /**
     * A hoof landing such as `leftForeOn`, a stroke start such as
     * `leftForeStroke`, or an `Event`.
     */
    label: string;
  }

  /** A grounded course on the footing whose swim-side speed the crossing owns. */
  export interface IGrounded {
    /** The legs in order, at least one; a leg's rise follows a graded bed. */
    legs: readonly rideQuadruped.ILeg[];
    /** The cruising speed, metres per second. */
    cruise: number;
    /** The acceleration, metres per second squared, where the course speeds up. */
    acceleration?: number;
    /** The braking, metres per second squared, where the course slows. */
    deceleration?: number;
    /**
     * The speed at the course's dry end, metres per second: the wading's start
     * speed, the climbing's end speed; 0 when absent.
     */
    speed?: number;
    /** The gait of every stride; the speed chooses it when absent. */
    gait?: AutoMovieArchetypeQuadrupedGait.Gait;
  }

  /**
   * The authored swim: its carriage and its timing. The cited studies measured
   * a swimming speed of 1.1 m/s and fore and hind cycles of 1.1 and 1.2 s
   * (forelimb and hindlimb studies, Table 1); one cycle serves both ends here.
   */
  export interface ISwim {
    /** The straight distance swum, metres, positive. */
    length: number;
    /**
     * The swimming speed, metres per second, positive; also the wading's end
     * speed and the climbing's start speed.
     */
    speed: number;
    /** One stroke cycle, seconds, positive. */
    cycle: number;
    /**
     * The neutral back's depth below the water while floating, metres; negative
     * above it.
     */
    immersion: number;
    /** The neck's raise above its neutral carriage, degrees. */
    neck: number;
  }

  /** The crossing: the water, its banks and beds, and the three segments. */
  export interface IParams {
    /** The water's surface height, world metres. */
    water: number;
    /** Every bed and bank, as authored world planes. */
    footing: AutoMovieArchetypeQuadrupedFooting.IScene;
    /**
     * Where the wading starts and its heading, as a course's start; the ground
     * under it is the wading course's datum.
     */
    start: AutoMovieArchetypeCourse.ICourse["start"];
    /** The grounded wading down the ford. */
    entry: IGrounded;
    /** The swim. */
    swim: ISwim;
    /**
     * The grounded climbing out from where the swim ends, on its heading; the
     * ground under its start is its datum.
     */
    recovery: IGrounded;
    /** Each cut's inertialization decay, seconds, positive. */
    transition: number;
  }

  /** One displayed second of the crossing. */
  export interface ISample<Id extends string, D extends string> {
    /** The animal in its pose, in the placement's model space. */
    archetype: AutoMovieArchetype<Id, D>;
    /** The animal's placement in the world. */
    placement: IAutoMovieTransform;
    /** The segment shown. */
    phase: Phase;
  }

  /** A crossing sampled by film second. */
  export interface IClip<Id extends string, D extends string> {
    /** The film second the climbing ends. */
    duration: number;
    /** The named contact changes, film seconds. */
    events: Readonly<Record<Event, number>>;
    /**
     * Every named instant in time order: the rides' hoof landings, the contact
     * changes and each stroke's start.
     */
    instants: readonly IInstant[];
    /**
     * The crossing at a film second; before 0 the wading's start and after the
     * end the climbing's end.
     */
    sample: (seconds: number) => ISample<Id, D>;
  }

  /**
   * Each limb's stroke phase offset, cycles: the diagonal pairs half a cycle
   * apart, a trot-like coordination authored for the take, since both cited
   * studies filmed only the left limbs.
   */
  export const PHASES: Readonly<
    Record<AutoMovieArchetypeQuadrupedBody.Limb, number>
  > = {
    leftFore: 0,
    rightHind: 0,
    rightFore: 0.5,
    leftHind: 0.5,
  };
}
