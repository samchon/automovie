import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import type { AutoMovieArchetypeQuadrupedLateralRestPlan } from "./AutoMovieArchetypeQuadrupedLateralRestPlan";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "./AutoMovieArchetypeQuadrupedRestPlan";

/**
 * A trained horse's liberty cue poses and its trained fall.
 *
 * The bow, kneel and sit are stance rows over a halt; the lie-down and the
 * lateral "dead" hold are the shared sternal and lateral rests
 * (`AutoMovieArchetypeQuadrupedRest`, `AutoMovieArchetypeQuadrupedLateralRest`)
 * played from the halt; the fall goes down from a canter or gallop onto
 * prepared ground (American Humane, horse guidelines for filmed media: trained
 * horses only, prepared ground).
 */
export namespace AutoMovieArchetypeEquineLibertyCue {
  /**
   * The bow: one foreleg stretched forward on the floor, the other knelt on its
   * carpus, the hind legs standing.
   */
  export interface IBow extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "bow";

    /** The stretched foreleg's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /** The kneel: both forelegs knelt on their carpi, the hind legs standing. */
  export interface IKneel extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "kneel";
  }

  /** The sit: the haunches on the floor, the forelegs straight on their hooves. */
  export interface ISit extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "sit";
  }

  /** Any liberty row of the stance. */
  export type Row = IBow | IKneel | ISit;

  /**
   * A shared rest's authored timing and folding, without the carriers and floor
   * the horse and its halt supply.
   */
  export type Rest = Omit<
    AutoMovieArchetypeQuadrupedRestPlan.IParams,
    "parts" | "contacts" | "floorY"
  >;

  /**
   * Lie down from the halt and stay, sternal, or roll onto a side and hold it
   * still as if dead, then rise.
   */
  export interface IRecline {
    /** Film second it starts, the horse halted. */
    from: number;

    /** The sternal rest's timing and folding. */
    rest: Rest;

    /** The lateral roll for the dead hold; absent, the horse lies sternal. */
    lateral?: AutoMovieArchetypeQuadrupedLateralRestPlan.IParams;
  }

  /**
   * A trained fall from a canter or gallop onto prepared ground: the horse
   * checks, goes down on one side, slides to a stop, lies still and rises.
   */
  export interface IFall {
    /** Film second it goes down, while moving. */
    from: number;

    /** Seconds from the stride into lying on its side. */
    drop: number;

    /** Metres it slides from the fall's start to its stop. */
    slide: number;

    /** Whether the author has marked the ground prepared for a fall. */
    prepared: boolean;

    /** The sternal rest's timing and folding, which the rise plays. */
    rest: Rest;

    /**
     * The lateral rest it lies in and rises from; its side is the side landed
     * on.
     */
    lateral: AutoMovieArchetypeQuadrupedLateralRestPlan.IParams;

    /** The walk it steps off into once it stands, if any. */
    away?: IAway;
  }

  /** A walk off from where a fallen horse stands up: its first steps. */
  export interface IAway {
    /** Metres walked straight ahead. */
    length: number;

    /** The walk's cruising speed, metres per second. */
    speed: number;
  }
}
