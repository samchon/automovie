import type { AutoMovieMatrix3Tuple } from "../../../geometry/AutoMovieMatrix3Tuple";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanSegmentFrame } from "../frame/IAutoMovieHumanSegmentFrame";

/**
 * Named segment frames and optional parent-relative joint rotations for
 * reference placement. Runtime construction and admission remain with
 * AutoMovieHumanF1Placement in Human.
 */
export namespace IAutoMovieHumanF1Placement {
  /** Every segment's frame in the figure's frame, by name. */
  export type IFrames = ReadonlyMap<string, IAutoMovieHumanSegmentFrame>;

  /**
   * A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or
   * undefined to keep its reference rotation.
   */
  export type IPose = (name: string) => AutoMovieMatrix3Tuple | undefined;

  /**
   * Resolve a registered datum's local coordinates for one person's segment
   * lengths.
   */
  export type ILocals = (name: string) => AutoMovieVector3Tuple;
}
