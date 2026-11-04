import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A jointed axis: straight along each segment between consecutive centres, and at each interior centre a turn from one segment's direction to the next about their common normal, spread over the stated half length on either side by the quintic smoothstep of the turn angle, so the course is C2 and no section spins about it.
 *
 * The station is the arclength of that course from the first centre. A turn cuts its corner: the course passes inside the interior centre by the turn's sagitta, while every section outside the turns lies square to its own segment, as a limb's sections lie square to its bone. The chart axis `u` starts as `up` with its part along the first segment removed and turns with each joint's rotation; `v = u x t` for the tangent `t`.
 *
 * A turn is symmetric about the bisector of its corner, so its straight ends lie on the two segments' lines, each at the set-back `d` from the centre that the half length and the angle fix (`d = h` for no turn, less as the angle grows).
 *
 * Engine admission: at least two centres with no two consecutive equal and no two consecutive segments opposite; one half length per interior centre, positive; the set-backs on each segment summing to less than its length; `up` not along the first segment.
 *
 * @evidence contracts/common.md#principled-implementation A limb is straight along each bone and turns at each joint about the joint's hinge axis; the quintic smoothstep of the angle is C2 at both ends of the turn, so the frames and the sections they carry are C2 along the whole course, where a natural spline through the centres rings beside each joint.
 * @evidence contracts/common.md#clear-and-simple-design Centres, half lengths and one up direction fix every frame; the turn axes follow from consecutive segments, not from extra fields that could disagree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A turn that overruns its segment is refused, never shortened; a straight joint (parallel segments) has no turn.
 * @evidence contracts/common.md#meaningful-documentation States the course, the turn law and its continuity, the station, the corner cut, the carried axes and the admission rules.
 */
export interface IAutoMovieConstructionJointedAxis {
  /** Discriminator. */
  type: "jointed";

  /** The first end, each joint's centre in order, and the last end, metres in the construction's frame; at least two. */
  centres: IAutoMovieVector3[];

  /** Each interior centre's turn half length along the course, metres, positive. */
  halves: number[];

  /** The chart's first axis at the first segment; its part along the segment is removed. */
  up: IAutoMovieVector3;
}
