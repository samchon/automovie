import type { IAutoMovieVector3 } from "@automovie/interface";

import type { StrikingReach } from "./StrikingReach";

/**
 * A punch's reach on one goal of the fist, and one correction of the
 * tracker carried into it: the records the punch's contact solves and its
 * footwork, stroke and arm superpose (`punchContact`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two records and who reads them.
 * @evidence contracts/development/design.md#principled-representation A solution on one goal, and the change one correction makes to it on that correction's window.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records and the comparison of two reaches; split from `punchContact` so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the reach solution type and the tracker's unit window.
 */
export namespace punchReach {
  /**
   * A punch's reach on one goal of the fist: the step along the line, the
   * shoulder it carries and the arm solved there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The step in metres, the shoulder and the elbow's hint as world points, the arm as the reach solution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the punch's footwork and arm read of one solution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the reach solution type.
   */
  export interface IReach {
    /** The lead foot's step along the line, metres. */
    advance: number;

    /** The punching shoulder at contact. */
    shoulder: IAutoMovieVector3;

    /** The arm's solution at contact. */
    solved: StrikingReach.ISolution;

    /** The elbow's hint point at contact. */
    hint: IAutoMovieVector3;
  }

  /**
   * One correction of the tracker carried into the punch: what its arrival
   * changes in the step, the wrist at contact and the elbow's hint, on the
   * correction's own minimum-jerk window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation Changes over the reach before the correction, in metres, on the correction unit's window in film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the punch's footwork, stroke and arm superpose.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the tracker's unit window.
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

    /** Whether it moves the arm's solution at all; a target that holds still corrects nothing. */
    moved: boolean;
  }

  /**
   * Whether two reaches put the arm in the same place: the same step, wrist
   * and elbow, compared exactly.
   *
   * @param a One reach.
   * @param b The other.
   * @returns True when nothing differs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is compared and how.
   * @evidence contracts/development/implementation.md#principled-implementation A correction that moves nothing leaves the punch as its launch plan put it, bit for bit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conjunction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact comparison: any change counts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function same(a: IReach, b: IReach): boolean {
    const equal = (u: IAutoMovieVector3, v: IAutoMovieVector3): boolean =>
      u.x === v.x && u.y === v.y && u.z === v.z;
    return (
      a.advance === b.advance &&
      equal(a.solved.end, b.solved.end) &&
      equal(a.solved.middle, b.solved.middle)
    );
  }
}
