import type { IAutoMovieTransform } from "@automovie/interface";

import type {
  AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * The authored stages, the visible trace states and the displayed samples of a
 * single horse put to, drawing and taken out of a two-wheeled cart
 * (`AutoMovieArchetypeEquineDraft`).
 */
export namespace AutoMovieArchetypeEquineDraftPlan {
  /**
   * The take's stages in film order: backing into the shafts, connecting the
   * traces, drawing, braking into the breeching, releasing the traces, and
   * walking out of the shafts.
   */
  export type Stage =
    | "approach"
    | "connection"
    | "pull"
    | "brake"
    | "release"
    | "depart";

  /**
   * A trace's visible state: not hooked, hooked and hanging slack, or drawn
   * straight under draught.
   */
  export type Tension = "detached" | "slack" | "taut";

  /**
   * The take: where the horse starts, how far it backs, the pull and the walk
   * out, and the stage durations.
   */
  export interface IParams {
    /** Where the horse starts and its heading, facing away from the cart. */
    start: AutoMovieArchetypeCourse.ICourse["start"];
    /** The rein-back distance into the shafts, metres, positive. */
    approach: number;
    /** Seconds standing while the traces are hooked, positive. */
    connect: number;
    /** The drawn legs, ending in the brake to a stop; at least one. */
    pull: readonly AutoMovieArchetypeQuadruped.IRideLeg[];
    /** Seconds standing while the traces are unhooked, positive. */
    release: number;
    /** The unloaded legs out of the shafts; at least one. */
    depart: readonly AutoMovieArchetypeQuadruped.IRideLeg[];
    /** The cruising speed, metres per second. */
    cruise: number;
    /** The acceleration, metres per second squared. */
    acceleration: number;
    /** The braking, metres per second squared. */
    deceleration: number;
    /** A slack trace's sag below its chord at its middle, metres, positive. */
    sag: number;
    /**
     * Authored ground under the horse and the cart's wheels; level Y=0 when
     * absent.
     */
    footing?: AutoMovieArchetypeQuadrupedFooting.IScene;
  }

  /** One displayed second of the take. */
  export interface ISample<
    HorseId extends string,
    HorseD extends string,
    CartId extends string,
    CartD extends string,
  > {
    /** The stage shown. */
    stage: Stage;
    /** The traces' visible state. */
    tension: Tension;
    /** Whether the breeching holds the cart back. */
    breeching: boolean;
    /** The horse. */
    horse: AutoMovieArchetypeRide.ISample<HorseId, HorseD>;
    /** The cart in its placement's model space. */
    cart: AutoMovieArchetype<CartId, CartD>;
    /** The cart's world placement. */
    placement: IAutoMovieTransform;
    /**
     * The laid traces, absent when detached; a slack trace sags through
     * intermediate points.
     */
    traces: readonly AutoMovieArchetypeRide.ILineState[];
    /** The driving lines while the horse stands in the shafts. */
    lines: readonly AutoMovieArchetypeRide.ILineState[];
  }

  /** One labelled film second of the horse's ride. */
  export interface IInstant {
    /** Film seconds. */
    seconds: number;
    /** The ride's label, such as `stop1`. */
    label: string;
  }

  /** The take's stage boundaries, film seconds. */
  export interface IEvents {
    /** The hitch reaches the coupling. */
    connect: number;
    /** The horse leans into the collar. */
    pull: number;
    /** The braking begins. */
    brake: number;
    /** The cart stands; the traces come off. */
    release: number;
    /** The horse walks out of the shafts. */
    depart: number;
  }

  /** A take sampled by film second. */
  export interface ITake<
    HorseId extends string,
    HorseD extends string,
    CartId extends string,
    CartD extends string,
  > {
    /** The film second the walk out ends. */
    duration: number;
    /** The stage boundaries. */
    events: IEvents;
    /** The horse's ride, its course and instants. */
    ride: AutoMovieArchetypeRide.IRide<HorseId, HorseD>;
    /** The take at a film second. */
    at: (seconds: number) => ISample<HorseId, HorseD, CartId, CartD>;
  }
}
