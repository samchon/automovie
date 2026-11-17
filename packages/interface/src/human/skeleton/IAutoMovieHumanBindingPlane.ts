import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanJointTransition } from "./IAutoMovieHumanJointTransition";

/**
 * A plane across a joint: a point's share climbs from behind it to before it.
 *
 * @evidence contracts/common.md#meaningful-documentation States each field's unit, frame and meaning.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A plane across a joint: a point's share climbs from behind it to before it.
 * @evidence contracts/development/design.md#principled-representation `at`: Point on the plane, metres. `normal`: Unit normal toward the child. `half`: Half of the ramp's width, metres; the widest sector's where sectors are read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanCrotchBinding.start. Also types AutoMovieHumanCrotchBinding.clear.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `sectors`: The half width by sector round the normal, or none for one half all round.
 */
export interface IAutoMovieHumanBindingPlane {
  /** Point on the plane, metres. */
  at: AutoMovieVector3Tuple;

  /** Unit normal toward the child. */
  normal: AutoMovieVector3Tuple;

  /** Half of the ramp's width, metres; the widest sector's where sectors are read. */
  half: number;

  /** The step the share climbs on, over -1 to 1. */
  step: (x: number) => number;

  /** The half width by sector round the normal, or none for one half all round. */
  sectors?: IAutoMovieHumanJointTransition.ISectors;
}
