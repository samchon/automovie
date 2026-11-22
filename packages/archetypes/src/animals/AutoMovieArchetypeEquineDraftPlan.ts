import type { IAutoMovieTransform } from "@automovie/interface";

import type {
  AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * The authored stages, the visible trace states and the displayed samples of a single horse put to, drawing and taken out of a two-wheeled cart (`AutoMovieArchetypeEquineDraft`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the stages, the trace states, the authored inputs and the sample.
 * @evidence contracts/development/design.md#principled-representation Closed unions for the stages and trace states; metres, seconds and the existing course legs for the inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned beside `AutoMovieArchetypeEquineDraft`, its only producer; read by its callers and specs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Trace slack and tension are authored visible states, not a simulated cable or a measured force.
 */
export namespace AutoMovieArchetypeEquineDraftPlan {
  /**
   * The take's stages in film order: backing into the shafts, connecting the traces, drawing, braking into the breeching, releasing the traces, and walking out of the shafts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each stage in order.
   * @evidence contracts/development/design.md#principled-representation A closed union of the six stages of one clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carried by each sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Stage =
    | "approach"
    | "connection"
    | "pull"
    | "brake"
    | "release"
    | "depart";

  /**
   * A trace's visible state: not hooked, hooked and hanging slack, or drawn straight under draught.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each state's look.
   * @evidence contracts/development/design.md#principled-representation A closed union the stage determines.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carried by each sample and shown by its laid traces.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An authored look, not a force reading.
   */
  export type Tension = "detached" | "slack" | "taut";

  /**
   * The take: where the horse starts, how far it backs, the pull and the walk out, and the stage durations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and role.
   * @evidence contracts/development/design.md#principled-representation World metres and seconds, course legs for the drawn and the unloaded travel, positive stage durations and sag.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `AutoMovieArchetypeEquineDraft` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The parked cart's place is not authored separately: it stands where the horse's hitch stops, so the two cannot disagree.
   */
  export interface IParams {
    /** Where the horse starts and its heading, facing away from the cart. */
    start: AutoMovieArchetypeCourse.ICourse["start"];
    /** The rein-back distance into the shafts, metres, positive. */
    approach: number;
    /** Seconds standing while the traces are hooked, positive. */
    connect: number;
    /** The drawn legs, ending in the brake to a stop; at least one. */
    pull: readonly rideQuadruped.ILeg[];
    /** Seconds standing while the traces are unhooked, positive. */
    release: number;
    /** The unloaded legs out of the shafts; at least one. */
    depart: readonly rideQuadruped.ILeg[];
    /** The cruising speed, metres per second. */
    cruise: number;
    /** The acceleration, metres per second squared. */
    acceleration: number;
    /** The braking, metres per second squared. */
    deceleration: number;
    /** A slack trace's sag below its chord at its middle, metres, positive. */
    sag: number;
    /** Authored ground under the horse and the cart's wheels; level Y=0 when absent. */
    footing?: AutoMovieArchetypeQuadrupedFooting.IScene;
  }

  /**
   * One displayed second of the take.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's space.
   * @evidence contracts/development/design.md#principled-representation The horse's ride sample, the cart's model and placement, and the laid traces and driving lines as world points.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by the take's sampler.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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
    /** The laid traces, absent when detached; a slack trace sags through intermediate points. */
    traces: readonly AutoMovieArchetypeRide.ILineState[];
    /** The driving lines while the horse stands in the shafts. */
    lines: readonly AutoMovieArchetypeRide.ILineState[];
  }

  /**
   * One labelled film second of the horse's ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the label.
   * @evidence contracts/development/design.md#principled-representation A film second and its label, the form every ride's instants take.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read when the take finds its stop instants.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IInstant {
    /** Film seconds. */
    seconds: number;
    /** The ride's label, such as `stop1`. */
    label: string;
  }

  /**
   * The take's stage boundaries, film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each boundary.
   * @evidence contracts/development/design.md#principled-representation Ordered film seconds read off the horse's course.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned with the take.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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

  /**
   * A take sampled by film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the duration, events and sampler.
   * @evidence contracts/development/design.md#principled-representation A pure function of film seconds with its boundaries as data.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `AutoMovieArchetypeEquineDraft`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No playback state.
   */
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
    /**
     * The take at a film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and the fresh sample.
     * @evidence contracts/development/implementation.md#principled-implementation The horse's ride sample, the cart's towed placement on the hitch while coupled and its parked placement otherwise, and traces laid between their ends.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the stage, read both supports, lay the lines.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every point comes from the posed models; nothing is cached between seconds.
     * @evidence contracts/development/implementation.md#efficient-algorithms One horse sample and one towed sample per call.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the prepared ride and towing.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
     */
    at: (seconds: number) => ISample<HorseId, HorseD, CartId, CartD>;
  }
}
