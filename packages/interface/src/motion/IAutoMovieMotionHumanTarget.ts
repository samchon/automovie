import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanBend } from "./IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanHand } from "./IAutoMovieMotionHumanHand";

/**
 * Where an action is directed: a target resolved to a place, and a place turned
 * into a hand's or a foot's goal.
 *
 * Every directed action works with no target. A place is a point with the
 * outward normal of whatever is there, and it says whether anything is there: a
 * person, a prop, the performer's own body and a point given with a normal are
 * solid; a bare point, the virtual opponent of `none` and the default place are
 * not. An action without a target (absent, or `none` with neither a line nor a
 * range) takes its own default place, stated in the performer's proportions,
 * and performs the same movement in the air: a punch extends to it, a handshake
 * offers the hand there, a pick up closes the hand on nothing. A law reads
 * `solid` to decide what only a real thing allows (a contact window, a grip,
 * the aimed movement time) and never branches on the target's kind.
 */
export namespace IAutoMovieMotionHumanTarget {
  /** A default place in the performer's proportions. */
  export interface IDefault {
    /** Height above the floor, as a share of the stature. */
    height: number;

    /**
     * Distance ahead of the root, as a share of the arm (upper arm and
     * forearm).
     */
    range: number;

    /**
     * Offset toward the performer's left, as a share of the half shoulder
     * width; negative is right, 0 when absent.
     */
    lateral?: number;

    /**
     * Which way the place faces: back at the performer, or up as a table top
     * does.
     */
    facing: "performer" | "up";
  }

  /** A named whole place: a key of `DEFAULTS`. */
  export type Name = keyof Readonly<
    Record<"ahead" | "desk" | "floor", IAutoMovieMotionHumanTarget.IDefault>
  >;

  /** A place an action is directed at, world frame. */
  export interface IPlace {
    /** The point, world metres. */
    point: IAutoMovieVector3;

    /** The outward unit normal of the surface at the point. */
    normal: IAutoMovieVector3;

    /**
     * Whether a real thing is at the point, so it can be touched, gripped or
     * struck.
     */
    solid: boolean;

    /** The thing's width across a grip or a touch, metres; unknown when absent. */
    width?: number;
  }

  /** Options of a hand's goal on a place. */
  export interface IHand {
    /** The surface laid on the place; the palm when absent. */
    surface?: IAutoMovieMotionHumanHand.Surface;

    /** The hand shape held there; relaxed when absent. */
    shape?: IAutoMovieMotionHumanHand.Shape;

    /** Where the surface's forward points, world; chosen by `hand` when absent. */
    forward?: IAutoMovieVector3;

    /**
     * The elbow's preset or shares; absent with `out` absent too, the elbow
     * place `AutoMovieMotionHumanBend.solve` finds, and `hang` where it refuses
     * the goal.
     */
    bend?: IAutoMovieMotionHumanBend.Arm | IAutoMovieMotionHumanBend.IShares;

    /**
     * Extra flexion of every finger joint over the shape, degrees; 0 when
     * absent.
     */
    curl?: number;

    /**
     * A share added to the bend's outward share, as a manner's `bend` is; 0
     * when absent. Stated without `bend`, it widens `hang`.
     */
    out?: number;
  }
}
