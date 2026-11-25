import type {
  IAutoMovieMotionHumanStrikingReach,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A punch's reach on one goal of the fist, and one correction of the tracker
 * carried into it: the records the punch's contact solves and its footwork,
 * stroke and arm superpose (`punchContact`).
 */
export namespace punchReach {
  /**
   * A punch's reach on one goal of the fist: the step along the line, the
   * shoulder it carries and the arm solved there.
   */
  export interface IReach {
    /** The lead foot's step along the line, metres. */
    advance: number;

    /** The punching shoulder at contact. */
    shoulder: IAutoMovieVector3;

    /** The arm's solution at contact. */
    solved: IAutoMovieMotionHumanStrikingReach.ISolution;

    /** The elbow's hint point at contact. */
    hint: IAutoMovieVector3;
  }

  /**
   * One correction of the tracker carried into the punch: what its arrival
   * changes in the step, the wrist at contact and the elbow's hint, on the
   * correction's own minimum-jerk window.
   */
  export interface ICorrection {
    /** The correction's start, film seconds. */
    start: number;

    /** The correction's duration, seconds. */
    duration: number;

    /** What it adds to the step, metres. */
    advance: number;

    /** What it moves the wrist at contact by, world metres. */
    end: IAutoMovieVector3;

    /** What it moves the elbow's hint by, world metres. */
    hint: IAutoMovieVector3;

    /** The reach once it has arrived. */
    reach: IReach;

    /**
     * Whether it moves the arm's solution at all; a target that holds still
     * corrects nothing.
     */
    moved: boolean;
  }

  /** What `same` compares of a reach: its advance and its solved joints. */
  export interface ISame extends Pick<IReach, "advance"> {
    /** The solved elbow and wrist. */
    solved: Pick<
      IAutoMovieMotionHumanStrikingReach.ISolution,
      "end" | "middle"
    >;
  }

  /**
   * Whether two reaches put the arm in the same place: the same step, wrist and
   * elbow, compared exactly.
   *
   * @param a One reach.
   * @param b The other.
   * @returns True when nothing differs.
   */
  export function same(a: ISame, b: ISame): boolean {
    const equal = (u: IAutoMovieVector3, v: IAutoMovieVector3): boolean =>
      u.x === v.x && u.y === v.y && u.z === v.z;
    return (
      a.advance === b.advance &&
      equal(a.solved.end, b.solved.end) &&
      equal(a.solved.middle, b.solved.middle)
    );
  }
}
