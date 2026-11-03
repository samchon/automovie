import type { AutoMovieHumanJointTransition } from "./AutoMovieHumanJointTransition";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * A plane across a joint: a point's share climbs from behind it to before it.
 *
 * @evidence contracts/common.md#meaningful-documentation States each field's unit, frame and meaning.
 */
export interface IAutoMovieHumanBindingPlane {
  /** Point on the plane, metres. */
  at: Math3D.Vector;

  /** Unit normal toward the child. */
  normal: Math3D.Vector;

  /** Half of the ramp's width, metres; the widest sector's where sectors are read. */
  half: number;

  /** The step the share climbs on, over -1 to 1. */
  step: (x: number) => number;

  /** The half width by sector round the normal, or none for one half all round. */
  sectors?: AutoMovieHumanJointTransition.ISectors;
}
