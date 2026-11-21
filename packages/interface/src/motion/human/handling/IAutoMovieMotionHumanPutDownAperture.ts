import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A held object placed through an authored opening into a seat.
 *
 * The stationary receptacle's opening, seat and optional waypoints share the
 * same orientation. The approach waypoints precede the opening, and the
 * insertion waypoints follow the opening before the seat. The law retraces
 * the path when the hand leaves. The author keeps the path clear.
 * The held prop's selected socket or origin reaches the opening at
 * `aperture`, the seat at `placed`, and stays mounted while the hand opens
 * until `release`. The law checks the frames and arm reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the prop, its attachment point, the receiver frames and optional waypoint groups and the event that transfers ownership.
 * @evidence contracts/development/design.md#principled-representation All targets are affordance ids on one stationary prop and share an orientation. The two waypoint groups preserve the mandatory aperture event.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The registered putDownAperture law reads this input without extending the inherited placement schema.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Identifies authored affordances instead of presuming prop kinds, dimensions or collision-free geometry.
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

    /** The receptacle's guide that carries the object from the opening to the seat, as a scabbard guides its blade home; the hand alone carries it when absent. */
    guide?: IAutoMovieMotionHumanPutDownAperture.IGuide;
  };
}
export namespace IAutoMovieMotionHumanPutDownAperture {
  /**
   * A slider on the receptacle running from the seat toward the opening, in
   * metres, and the socket that rides it. The object rides the socket from
   * the opening to the seat while the placement drives the slider from the
   * opening's distance back to 0, as `IAutoMovieMotionHumanDrawFromCarrier`
   * drives it out.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the slider, its unit and direction, and the riding socket.
   * @evidence contracts/development/design.md#principled-representation Two affordance ids of the receptacle; the placement law checks them against it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two ids `putDownAperture` reads; `HumanSheath.sheathe` writes them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both ids are required together, so a half-declared guide cannot be written.
   */
  export interface IGuide {
    /** The receptacle's slider articulation id. */
    slider: string;

    /** The receptacle's socket riding the slider. */
    slide: string;
  }
}
