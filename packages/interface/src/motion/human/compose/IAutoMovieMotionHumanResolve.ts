import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTargetGrid } from "./IAutoMovieMotionHumanTargetGrid";

/**
 * What an authoring spec is on a body: a place in shares and in metres, an
 * elbow preset in shares and in metres, an amount as a share and in degrees,
 * the inverse from metres to shares, and a table of every name across a set of
 * bodies.
 *
 * A law is written in names and shares, and a correction is asked for in
 * centimetres ("3 cm further forward"). This owner shows both sides, so an
 * author reads what a spec is on a body before a capture and turns a requested
 * distance into the nudge that states it. Metres are in the performer's floor
 * frame: the origin on the floor under the root, `x` to the performer's left,
 * `y` up, `z` forward.
 */
export namespace IAutoMovieMotionHumanResolve {
  /** A place on a body. */
  export interface IPlace {
    /** The share record. */
    shares: IAutoMovieMotionHumanTarget.IDefault;

    /** The point in the performer's floor frame, metres. */
    metres: IAutoMovieVector3;
  }

  /** A displacement in the units a place and a nudge are written in. */
  export interface IShift {
    /** Forward, in arm lengths: a difference of `range`. */
    forward: number;

    /** Upward, in statures: a difference of `height`. */
    up: number;

    /**
     * To the performer's left, in half shoulder widths: a difference of
     * `lateral`.
     */
    left: number;

    /** The same displacement as a nudge of the left hand, in arm lengths. */
    nudge: Required<IAutoMovieMotionHumanTargetGrid.INudge>;
  }

  /** An elbow hint on a body. */
  export interface IBend {
    /** The shares, the extra outward share included. */
    shares: IAutoMovieMotionHumanBend.IShares;

    /**
     * The offset from the shoulder's rest place, metres: `x` outward, `y` up,
     * `z` forward.
     */
    metres: IAutoMovieVector3;
  }

  /** An amount on a joint. */
  export interface IAmount {
    /** The share of the motion's limit. */
    share: number;

    /** Signed clinical degrees. */
    degrees: number;
  }

  /** A named body of a table. */
  export interface IBody {
    /** The column's label. */
    name: string;

    /** The body. */
    body: Pick<IAutoMovieMotionHumanBody, "measure">;
  }

  /**
   * The solved elbow beside the `hang` preset on a set of bodies, as text: one
   * row per place with one column per body. Input bodies of
   * AutoMovieMotionHumanResolve.swivel. The bodies, in column order.
   */
  export type ISwivelBodies = readonly {
    /** Display label for this body's column in the textual swivel comparison. */
    name: string;
    /**
     * Borrowed body geometry and joint constraints used to compute that
     * comparison column.
     */
    body: IAutoMovieMotionHumanBody;
  }[];
}
