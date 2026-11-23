import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Contacts for a grounded step vault. The named hand and opposite foot support
 * the crossing while the foot on the hand's side passes between them. The
 * supporting foot then follows to the exit. Give fixed targets with enough room
 * for the ordinary support-sequence swing.
 */
export interface IAutoMovieMotionHumanStepVault {
  /** The supporting hand. The foot on this same side crosses first. */
  hand: AutoMovieHumanSide;

  /** Foot contacts on the approach side. */
  entry: IAutoMovieMotionHumanStepVault.IFeet;

  /** The fixed support for the selected palm. */
  palm: IAutoMovieMotionHumanStepVault.Target;

  /** The fixed support for the opposite foot while the first foot crosses. */
  step: IAutoMovieMotionHumanStepVault.Target;

  /** Foot contacts on the exit side. */
  exit: IAutoMovieMotionHumanStepVault.IFeet;
}

/** Targets on the fixed surfaces that support a step vault. */
export namespace IAutoMovieMotionHumanStepVault {
  /**
   * A fixed prop's named contact or a fixed point in metres in the indicated
   * frame. The support action resolves it at entry.
   */
  export type Target = Extract<
    IAutoMovieMotionTarget,
    { kind: "prop" | "point" }
  >;

  /** The pair of places where the feet bear at one end of the crossing. */
  export interface IFeet {
    /** Where the left foot bears. */
    left: IAutoMovieMotionHumanStepVault.Target;

    /** Where the right foot bears. */
    right: IAutoMovieMotionHumanStepVault.Target;
  }
}
