import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTargetGrid } from "./IAutoMovieMotionHumanTargetGrid";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * What an authoring spec is on a body: a place in shares and in metres, an
 * elbow preset in shares and in metres, an amount as a share and in degrees,
 * the inverse from metres to shares, and a table of every name across a set
 * of bodies.
 *
 * A law is written in names and shares, and a correction is asked for in
 * centimetres ("3 cm further forward"). This owner shows both sides, so an
 * author reads what a spec is on a body before a capture and turns a
 * requested distance into the nudge that states it. Metres are in the
 * performer's floor frame: the origin on the floor under the root, `x` to
 * the performer's left, `y` up, `z` forward.
 *
 * @evidence contracts/development/common.md#meaningful-documentation shares: The share record. metres: The point in the performer's floor frame, metres. shares: The shares, the extra outward share included.
 * @evidence contracts/development/design.md#principled-representation shares: The share record. metres: The point in the performer's floor frame, metres. shares: The shares, the extra outward share included.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.place, return); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.shares, return); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.bend, return); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.amount, return); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.table, bodies); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.table.row, b).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTarget.IDefault, IAutoMovieVector3, IAutoMovieMotionHumanTargetGrid.INudge, IAutoMovieMotionHumanBend.IShares identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanResolve {
  /**
   * A place on a body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation The share record beside the point it is on this body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; returned by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the place owner's record.
   */
  export interface IPlace {
    /** The share record. */
    shares: IAutoMovieMotionHumanTarget.IDefault;

    /** The point in the performer's floor frame, metres. */
    metres: IAutoMovieVector3;
  }

  /**
   * A displacement in the units a place and a nudge are written in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation One share per axis, each of the measure its axis is read against.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members; returned by `shares`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The nudge is given in its own unit, so it is not converted by hand.
   */
  export interface IShift {
    /** Forward, in arm lengths: a difference of `range`. */
    forward: number;

    /** Upward, in statures: a difference of `height`. */
    up: number;

    /** To the performer's left, in half shoulder widths: a difference of `lateral`. */
    left: number;

    /** The same displacement as a nudge of the left hand, in arm lengths. */
    nudge: Required<IAutoMovieMotionHumanTargetGrid.INudge>;
  }

  /**
   * An elbow hint on a body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and origin.
   * @evidence contracts/development/design.md#principled-representation The preset's shares beside the offset from the shoulder they are on this body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; returned by `bend`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the bend owner's record.
   */
  export interface IBend {
    /** The shares, the extra outward share included. */
    shares: IAutoMovieMotionHumanBend.IShares;

    /** The offset from the shoulder's rest place, metres: `x` outward, `y` up, `z` forward. */
    metres: IAutoMovieVector3;
  }

  /**
   * An amount on a joint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The share of the motion's limit beside the signed degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; returned by `amount`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both are read from the range owner.
   */
  export interface IAmount {
    /** The share of the motion's limit. */
    share: number;

    /** Signed clinical degrees. */
    degrees: number;
  }

  /**
   * A named body of a table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its role.
   * @evidence contracts/development/design.md#principled-representation The column's label and the measure the column is computed from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `table`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the measure is asked for, so a capture body and a test stub both fit.
   */
  export interface IBody {
    /** The column's label. */
    name: string;

    /** The body. */
    body: Pick<IAutoMovieMotionHumanBody, "measure">;
  }

  /**
   * The solved elbow beside the `hang` preset on a set of bodies, as text: one row per place with one column per body. Input bodies of AutoMovieMotionHumanResolve.swivel. The bodies, in column order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation name: Display label for this body's column in the textual swivel comparison. body: Borrowed body geometry and joint constraints used to compute that comparison column.
   * @evidence contracts/development/design.md#principled-representation name: Display label for this body's column in the textual swivel comparison. body: Borrowed body geometry and joint constraints used to compute that comparison column.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.swivel, bodies).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ISwivelBodies = readonly {
    /** Display label for this body's column in the textual swivel comparison. */
    name: string;
    /** Borrowed body geometry and joint constraints used to compute that comparison column. */
    body: IAutoMovieMotionHumanBody;
  }[];
}
