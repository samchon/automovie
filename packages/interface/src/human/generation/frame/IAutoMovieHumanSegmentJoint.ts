import type { AutoMovieMatrix3Tuple } from "../../../geometry/AutoMovieMatrix3Tuple";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * One segment of a chain: its parent, its origin in the parent's frame and its
 * reference rotation.
 */
export interface IAutoMovieHumanSegmentJoint {
  /** The segment's name. */
  name: string;

  /** The parent segment's name; null for the root. */
  parent: string | null;

  /** The origin in the parent's frame, mm (the root: in the figure's frame). */
  offset: AutoMovieVector3Tuple;

  /**
   * The reference rotation `A_parent^T A_child` (the root: its axes as
   * columns).
   */
  rotation: AutoMovieMatrix3Tuple;
}
