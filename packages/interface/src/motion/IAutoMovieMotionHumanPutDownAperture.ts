import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * A held object placed through an authored opening into a seat.
 *
 * The stationary receptacle's opening, seat and optional waypoints share the
 * same orientation. The approach waypoints precede the opening, and the
 * insertion waypoints follow the opening before the seat. The law retraces the
 * path when the hand leaves. The author keeps the path clear. The held prop's
 * selected socket or origin reaches the opening at `aperture`, the seat at
 * `placed`, and stays mounted while the hand opens until `release`. The law
 * checks the frames and arm reach.
 */
export interface IAutoMovieMotionHumanPutDownAperture {
  /** The held object's scene subject id. */
  prop: string;

  /** The holding hand. Defaults to the right hand. */
  hand?: AutoMovieHumanSide;

  /** The receptacle and its ordered placement sites. */
  onto: {
    /** The receptacle's scene subject id. */
    prop: string;

    /** Affordance at the opening where the object finishes its approach. */
    aperture: string;

    /** Affordance at the seated frame where the object mounts. */
    point: string;

    /** Fixed affordances reached in order before the opening. */
    approach?: readonly string[];

    /** Fixed affordances reached in order after the opening and before seating. */
    insertion?: readonly string[];

    /** The held object's matching affordance. Defaults to its origin. */
    via?: string;

    /**
     * The receptacle's guide that carries the object from the opening to the
     * seat, as a scabbard guides its blade home; the hand alone carries it when
     * absent.
     */
    guide?: IAutoMovieMotionHumanPutDownAperture.IGuide;
  };
}
export namespace IAutoMovieMotionHumanPutDownAperture {
  /**
   * A slider on the receptacle running from the seat toward the opening, in
   * metres, and the socket that rides it. The object rides the socket from the
   * opening to the seat while the placement drives the slider from the
   * opening's distance back to 0, as `IAutoMovieMotionHumanDrawFromCarrier`
   * drives it out.
   */
  export interface IGuide {
    /** The receptacle's slider articulation id. */
    slider: string;

    /** The receptacle's socket riding the slider. */
    slide: string;
  }
}
