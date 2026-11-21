import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A gripped object drawn out of its carrier along an authored straight line,
 * the inverse of aperture placement: a sword out of its scabbard.
 *
 * The seat and the opening are two affordances on the carrier, sharing an
 * attitude at distinct positions, as `IAutoMovieMotionHumanPutDownAperture`
 * names them. The carrier also declares a slider whose travel runs from the
 * seat to the opening and a socket that rides it, so the carrier keeps the
 * object on its line while it leaves, as a scabbard guides its blade. The
 * object rides that socket from the seat to the opening at the seat's
 * attitude, the hand following on its grip, and the hand takes it over at
 * the opening. The carrier holds still for the draw; a worn carrier holds
 * still while its wearer stands.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the object, the hand, the carrier's two frames, the straight line and the stillness premise.
 * @evidence contracts/development/design.md#principled-representation The carrier's affordance ids define the line and the guide in the carrier's own frame, so they follow a worn carrier.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The registered `drawFromCarrier` law reads it; `HumanSheath.draw` writes it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Affordance ids instead of a blade or carrier kind or a written length.
 */
export interface IAutoMovieMotionHumanDrawFromCarrier {
  /** The gripped object's scene subject id. */
  prop: string;

  /** The gripping hand. Defaults to the right hand. */
  hand?: AutoMovieHumanSide;

  /** The carrier and both of its affordance ids. */
  from: IAutoMovieMotionHumanDrawFromCarrier.IFrom;
}
export namespace IAutoMovieMotionHumanDrawFromCarrier {
  /**
   * The carrier the object leaves and the line it leaves along.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each affordance's role.
   * @evidence contracts/development/design.md#principled-representation Scene subject and affordance ids, checked by the law against the carrier.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The five ids the law reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IFrom {
    /** The carrier's scene subject id. */
    prop: string;

    /** Affordance where the object's frame sits once drawn. */
    aperture: string;

    /** Affordance where the object's frame sits seated. */
    point: string;

    /** The carrier's slider articulation, its travel in metres from the seat toward the opening. */
    slider: string;

    /** The carrier's socket that rides the slider, where the object's frame sits as it leaves. */
    slide: string;
  }
}
