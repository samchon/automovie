import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * A gripped object drawn out of its carrier along an authored straight line,
 * the inverse of aperture placement: a sword out of its scabbard.
 *
 * The seat and the opening are two affordances on the carrier, sharing an
 * attitude at distinct positions, as `IAutoMovieMotionHumanPutDownAperture`
 * names them. The carrier also declares a slider whose travel runs from the
 * seat to the opening and a socket that rides it, so the carrier keeps the
 * object on its line while it leaves, as a scabbard guides its blade. The
 * object rides that socket from the seat to the opening at the seat's attitude,
 * the hand following on its grip, and the hand takes it over at the opening.
 * The carrier holds still for the draw; a worn carrier holds still while its
 * wearer stands.
 */
export interface IAutoMovieMotionHumanDrawFromCarrier {
  /** The gripped object's scene subject id. */
  prop: string;

  /** The gripping hand. Defaults to the right hand. */
  hand?: AutoMovieHumanSide;

  /** The carrier and both of its affordance ids. */
  from: IAutoMovieMotionHumanDrawFromCarrier.IFrom;

  /**
   * The other hand drawing a worn carrier back along its line and turning it
   * toward the drawing shoulder while the trunk turns, as a longsword is drawn
   * from the hip; the carrier holds still when absent.
   */
  pull?: IAutoMovieMotionHumanDrawFromCarrier.IPull;
}
export namespace IAutoMovieMotionHumanDrawFromCarrier {
  /** The carrier the object leaves and the line it leaves along. */
  export interface IFrom {
    /** The carrier's scene subject id. */
    prop: string;

    /** Affordance where the object's frame sits once drawn. */
    aperture: string;

    /** Affordance where the object's frame sits seated. */
    point: string;

    /**
     * The carrier's slider articulation, its travel in metres from the seat
     * toward the opening.
     */
    slider: string;

    /**
     * The carrier's socket that rides the slider, where the object's frame sits
     * as it leaves.
     */
    slide: string;
  }

  /**
   * The other hand's share of a long draw. A blade longer than the drawing
   * arm's reach along the line leaves its scabbard only when the other hand
   * draws the scabbard back at its throat and the hips turn away from the
   * drawing side, so the blade leaves across the body. The carrier rides the
   * other hand from its throat: it slides back along its own line (the frog
   * riding the belt) and then turns about where it hangs toward the drawing
   * shoulder, each by the least that brings the drawn hand within the arm's
   * reach, so the blade leaves low and in front along the moving line; it is
   * worn again on the bone it hung from where the draw leaves it.
   */
  export interface IPull {
    /** The carrier's affordance the other hand grips, at its throat. */
    handle: string;

    /**
     * How far the trunk turns away from the drawing side, degrees; 0 when
     * absent.
     */
    turn?: number;
  }
}
