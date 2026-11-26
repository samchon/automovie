import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanCrossing } from "./IAutoMovieMotionHumanCrossing";

/**
 * Authoring parameters for bathing compositions: getting into and out of a
 * bathtub, washing under a shower and drying with a towel.
 *
 * - Into the tub: step over its apron onto its floor, turn along the tub and sit
 *   on its floor with the legs long; out by stepping over the apron from inside
 *   onto the floor outside.
 * - Shower: turn the tap's knob on, scrub the scalp with both hands, the face and
 *   each forearm with the other hand, then turn it off.
 * - Towel: take the towel and rub it over the scalp with both hands.
 *
 * Each region is rubbed in 4 strokes, the tap knob turns a quarter turn (90
 * degrees) and the bather soaks 3 s in the tub (all provisional); the owning
 * constants are `AutoMovieMotionHumanBathing.SCRUBS`, `TAP_TURN` and `SOAK`.
 */
/** The authorable input types for bathing operations. */
export namespace IAutoMovieMotionHumanBathing {
  /** A region one hand scrubs with the other. */
  export type IWashed = "face" | "forearmLeft" | "forearmRight";

  /** The parameters of `intoTub`. */
  export interface IIntoTub {
    /** The tub's subject, the obstacle stepped over and the floor walked on. */
    tub: string;

    /** The tub's floor surface inside the apron, where both feet land. */
    floor: string;

    /** Where on the tub's floor the bather sits, world metres. */
    at: IAutoMovieVector3;

    /** The heading the bather sits facing, degrees about +Y: along the tub. */
    face: number;
  }

  /** The parameters of `outOfTub`. */
  export interface IOutOfTub {
    /** The tub's subject, the obstacle stepped over from inside. */
    tub: string;

    /** The level surface outside the tub both feet land on. */
    onto: IAutoMovieMotionHumanCrossing.ISurface;
  }

  /** The parameters of `shower`. */
  export interface IShower {
    /** The tap knob. */
    tap: IAutoMovieMotionTarget;
  }

  /** The parameters of `towelDry`. */
  export interface ITowelDry {
    /** The towel's subject. */
    towel: string;

    /** The towel's grip. */
    handle: string;
  }
}
