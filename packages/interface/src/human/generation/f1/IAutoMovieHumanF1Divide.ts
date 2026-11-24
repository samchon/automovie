import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Inputs and output of the F1 skin division shared by figure construction and the reference fit.
 */
export namespace IAutoMovieHumanF1Divide {
  /**
   * One surface dividing the skin between two groups of fitted parts.
   */
  export interface ISurface {
    /** The dividing surface's name. */
    name: string;

    /** The joint whose nearby surfaces divide this skin. */
    group: string;

    /** The parts on the negative side. */
    near: string[];

    /** The parts on the positive side. */
    far: string[];

    /** Signed distance in millimetres at a figure-space point, positive toward the far parts. */
    side: (point: AutoMovieVector3Tuple) => number;

    /**
     * The region where the field's sign divides skin. The near parts keep points outside this region. If omitted, the
     * field divides skin everywhere.
     */
    within?: (point: AutoMovieVector3Tuple) => boolean;

    /** Centre used to localize the division, in figure millimetres. */
    anchor: AutoMovieVector3Tuple;

    /** Reach of the division from the anchor in millimetres, used by the complement check. */
    reach: number;
  }

  /**
   * A parent's section plane where its children leave it.
   */
  export interface IEnd {
    /** Point on the parent's course, in figure millimetres. */
    point: AutoMovieVector3Tuple;

    /** Direction of the parent's course at that point, toward the children. */
    normal: AutoMovieVector3Tuple;
  }

  /**
   * A digit in a row and the first two centres on its course.
   */
  export interface IDigit {
    /** Family name used by the fitter and the tree. */
    part: string;

    /** The centre of the joint where the digit leaves its parent, in figure millimetres. */
    first: AutoMovieVector3Tuple;

    /** The centre of the next joint, in figure millimetres. */
    second: AutoMovieVector3Tuple;
  }

  /**
   * The landmarks' dividing field and its coverage for a part attached at a host's side.
   */
  export interface ILandmarked {
    /** Signed distance in millimetres at a figure-space point, positive toward the attached part. */
    side: (point: AutoMovieVector3Tuple) => number;

    /** Centre about which the surface was prepared, in figure millimetres. */
    centre: AutoMovieVector3Tuple;

    /** Radius in millimetres of the ball around the centre that holds the landmarks. */
    reach: number;

    /** At least two joint centres starting at the attachment, in figure millimetres. The course continues straight past the last. */
    course: AutoMovieVector3Tuple[];

    /** Radius in millimetres around the course where the field divides skin beyond the landmark ball. */
    tube: number;

    /** The attached family's name. */
    part: string;
  }

  /**
   * The anatomical inputs to the F1 skin division.
   */
  export interface IInput {
    /** The shoulder's landmark field and course coverage. */
    armscye: ILandmarked;

    /** The breast's landmark field, when the figure has this attachment. */
    mammary?: ILandmarked;

    /** The auricle's root field, when the plate has its own family. */
    ear?: ILandmarked;

    /** The wrist centre in figure millimetres. */
    wrist: AutoMovieVector3Tuple;

    /** The thumb's root field and course coverage. */
    thumb: ILandmarked;

    /** The fingers in row order, starting at the little finger. */
    fingers: IDigit[];

    /** The toes in row order, starting at the little toe. */
    toes: IDigit[];

    /** The sole's unit normal in the figure frame. */
    sole: AutoMovieVector3Tuple;

    /** The hip centre in figure millimetres. */
    hip: AutoMovieVector3Tuple;

    /** The height of the trunk family's first station, in figure millimetres. */
    foot: number;

    /** The section planes where the arm, hand and foot end. */
    ends: { wrist: IEnd; hand: IEnd; foot: IEnd };

    /** Family names for the parent parts and the reflected leg. */
    parts: { trunk: string; arm: string; hand: string; leg: string; twin: string };
  }
}
