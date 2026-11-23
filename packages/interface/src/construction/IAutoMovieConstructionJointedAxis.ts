import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieConstructionAxisRoll } from "./IAutoMovieConstructionAxisRoll";

/**
 * A jointed axis: straight along each segment between consecutive centres, and
 * at each interior centre a turn from one segment's direction to the next about
 * their common normal, spread over the stated half length on either side by the
 * quintic smoothstep of the turn angle, so the course is C2. Its material frame
 * has no additional spin unless roll explicitly requests one.
 *
 * The station is the arclength of that course from the first centre. A turn
 * cuts its corner: the course passes inside the interior centre by the turn's
 * sagitta, while every section outside the turns lies square to its own
 * segment, as a limb's sections lie square to its bone. The chart axis `u`
 * starts as `up` with its part along the first segment removed and turns with
 * each joint's rotation; `v = u x t` for the tangent `t`.
 *
 * A nonzero turn is symmetric about the bisector of its corner, so its straight
 * ends lie on the two segments' lines, each at the set-back `d` from the centre
 * that the half length and angle fix. An exactly straight joint has no turn,
 * consumes no half arclength and has zero set-back, including when its caller
 * supplied a positive half length.
 *
 * Engine admission: at least two finite centres with finite positive
 * consecutive separations and no opposite consecutive segments; one finite
 * nonnegative half length per interior centre, strictly positive for a nonzero
 * turn; the set-backs on each segment summing to less than its length; finite
 * `up` with finite norm and a normal projection longer than 1e-9 of that norm.
 * The last condition is the existing numerical direction-conditioning policy,
 * which also refuses some finite nonparallel inputs; it is not an anatomical or
 * exact-zero rule. A small nonzero bend angle is retained rather than treated
 * as straight by a tolerance.
 */
export interface IAutoMovieConstructionJointedAxis {
  /** Discriminator. */
  type: "jointed";

  /**
   * The first end, each joint's centre in order, and the last end, metres in
   * the construction's frame; at least two.
   */
  centres: IAutoMovieVector3[];

  /**
   * Each interior centre's requested turn half arclength, metres, finite and
   * nonnegative; positive for every nonzero turn. An exactly straight joint
   * consumes zero length and set-back.
   */
  halves: number[];

  /**
   * The chart's first axis at the first segment; its part along the segment is
   * removed.
   */
  up: IAutoMovieVector3;

  /**
   * Optional C2 material rotation relative to the base transported frame;
   * absent retains that frame exactly.
   */
  roll?: IAutoMovieConstructionAxisRoll;
}
