import type { AutoMovieMatrix3Tuple } from "../../../geometry/AutoMovieMatrix3Tuple";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** One segment of a chain: its parent, its origin in the parent's frame and its reference rotation.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One segment of a chain: its parent, its origin in the parent's frame and its reference rotation.
 * @evidence contracts/development/design.md#principled-representation `name`: The segment's name. `parent`: The parent segment's name; null for the root. `offset`: The origin in the parent's frame, mm (the root: in the figure's frame).
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanF1Frames.joints, AutoMovieHumanSegmentFrame.chain. Read by AutoMovieHumanSegmentFrame.world. Also types AutoMovieHumanF1Placing.CHAIN.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `parent`, `offset`, `rotation`; callers supply the complete record.
 */
export interface IAutoMovieHumanSegmentJoint {
  /** The segment's name. */
  name: string;

  /** The parent segment's name; null for the root. */
  parent: string | null;

  /** The origin in the parent's frame, mm (the root: in the figure's frame). */
  offset: AutoMovieVector3Tuple;

  /** The reference rotation `A_parent^T A_child` (the root: its axes as columns). */
  rotation: AutoMovieMatrix3Tuple;
}
