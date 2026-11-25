import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the ViewJointedCourse operations. */
export namespace IAutoMovieViewJointedCourse {
  /**
   * A prepared turn shared by admission, straight-run placement and frame
   * evaluation.
   */
  export interface ITurn {
    /** Index of the interior source centre. */
    centre: number;

    /** Half the turning arclength, mm; zero for an exactly straight joint. */
    half: number;

    /** Total nonnegative angle, radians. */
    angle: number;

    /** Unit rotation axis; zero on a straight joint. */
    axis: AutoMovieVector3Tuple;

    /** Distance removed from each neighbouring segment, mm. */
    setback: number;

    /** Arclength station of the turn's first point, mm. */
    start: number;
  }

  /** Admitted finite segments and nonoverlapping quintic-angle turns. */
  export interface ICourse {
    /** Unit segment directions in source order. */
    directions: AutoMovieVector3Tuple[];

    /** Positive segment lengths, mm. */
    lengths: number[];

    /** One admitted turn per interior source centre. */
    turns: IAutoMovieViewJointedCourse.ITurn[];
  }
}
