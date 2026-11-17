import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Where an action is directed: a target resolved to a place, and a place
 * turned into a hand's or a foot's goal.
 *
 * Every directed action works with no target. A place is a point with the
 * outward normal of whatever is there, and it says whether anything is
 * there: a person, a prop, the performer's own body and a point given with a
 * normal are solid; a bare point, the virtual opponent of `none` and the
 * default place are not. An action without a target (absent, or `none` with
 * neither a line nor a range) takes its own default place, stated in the
 * performer's proportions, and performs the same movement in the air: a punch
 * extends to it, a handshake offers the hand there, a pick up closes the
 * hand on nothing. A law reads `solid` to decide what only a real thing
 * allows (a contact window, a grip, the aimed movement time) and never
 * branches on the target's kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation height: Height above the floor, as a share of the stature. range: Distance ahead of the root, as a share of the arm (upper arm and forearm). lateral: Offset toward the performer's left, as a share of the half shoulder width; negative is right, 0 when absent.
 * @evidence contracts/development/design.md#principled-representation height: Height above the floor, as a share of the stature. range: Distance ahead of the root, as a share of the arm (upper arm and forearm). lateral: Offset toward the performer's left, as a share of the half shoulder width; negative is right, 0 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTarget.ts (AutoMovieMotionHumanTarget.fallback, place); compose/AutoMovieMotionHumanTarget.ts (AutoMovieMotionHumanTarget.resolve, place); compose/AutoMovieMotionHumanTargetGrid.ts (AutoMovieMotionHumanTargetGrid.place, return); compose/AutoMovieMotionHumanTargetGrid.ts (named, return); compose/AutoMovieMotionHumanTargetGrid.ts (nudged, record); compose/AutoMovieMotionHumanTargetGrid.ts (nudged, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanHand.Surface, IAutoMovieMotionHumanHand.Shape, IAutoMovieMotionHumanBend.Arm identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTarget {
  /**
   * A default place in the performer's proportions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame; each member gives its unit, its sign and its value when absent.
   * @evidence contracts/development/design.md#principled-representation A height in statures, a distance in arm lengths and a sideways offset in half shoulder widths, so the same record puts a short and a tall performer's hand where they would each hold it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, the least that places and faces a point ahead of a body; read by `fallback`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares of the body's measure, never metres; the facing is a closed union of the two cases the actions have.
   */
  export interface IDefault {
    /** Height above the floor, as a share of the stature. */
    height: number;

    /** Distance ahead of the root, as a share of the arm (upper arm and forearm). */
    range: number;

    /** Offset toward the performer's left, as a share of the half shoulder width; negative is right, 0 when absent. */
    lateral?: number;

    /** Which way the place faces: back at the performer, or up as a table top does. */
    facing: "performer" | "up";
  }

  /**
   * A named whole place: a key of `DEFAULTS`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the names are.
   * @evidence contracts/development/design.md#principled-representation Derived from the table's keys, so a name without a record cannot be written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One alias, read by `Place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Not a second list beside the table.
   */
  export type Name = keyof Readonly<
    Record<"ahead" | "desk" | "floor", IAutoMovieMotionHumanTarget.IDefault>
  >;

  /**
   * A place an action is directed at, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its frame, unit and meaning when absent.
   * @evidence contracts/development/design.md#principled-representation A point and the outward normal of the surface there, the frame a contact is made on, with whether a real thing is there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members; `width` is optional because only some solid things state one, and the timing owner reads exactly this pair.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The target's kind is not carried, so no law can branch on it.
   */
  export interface IPlace {
    /** The point, world metres. */
    point: IAutoMovieVector3;

    /** The outward unit normal of the surface at the point. */
    normal: IAutoMovieVector3;

    /** Whether a real thing is at the point, so it can be touched, gripped or struck. */
    solid: boolean;

    /** The thing's width across a grip or a touch, metres; unknown when absent. */
    width?: number;
  }

  /**
   * Options of a hand's goal on a place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its default.
   * @evidence contracts/development/design.md#principled-representation What a place does not decide about a hand on it: the surface laid on it, the shape, where the fingers point and how the elbow bends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all optional because each has a default every targetless action can take; read by `hand`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand's surface and shape unions and the bend presets.
   */
  export interface IHand {
    /** The surface laid on the place; the palm when absent. */
    surface?: IAutoMovieMotionHumanHand.Surface;

    /** The hand shape held there; relaxed when absent. */
    shape?: IAutoMovieMotionHumanHand.Shape;

    /** Where the surface's forward points, world; chosen by `hand` when absent. */
    forward?: IAutoMovieVector3;

    /** The elbow's preset or shares; absent with `out` absent too, the elbow place `AutoMovieMotionHumanBend.solve` finds, and `hang` where it refuses the goal. */
    bend?: IAutoMovieMotionHumanBend.Arm | IAutoMovieMotionHumanBend.IShares;

    /** Extra flexion of every finger joint over the shape, degrees; 0 when absent. */
    curl?: number;

    /** A share added to the bend's outward share, as a manner's `bend` is; 0 when absent. Stated without `bend`, it widens `hang`. */
    out?: number;
  }
}
