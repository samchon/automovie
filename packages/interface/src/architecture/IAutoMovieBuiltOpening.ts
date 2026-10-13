import { IAutoMovieOpeningOperation } from "./IAutoMovieOpeningOperation";
import { IAutoMovieOpeningProfile } from "./IAutoMovieOpeningProfile";

/**
 * One traversable or visible opening through a boundary.
 *
 * @evidence contracts/common.md#principled-implementation An opening cites its host boundary by id, and a stated profile's bulge-aware hull is tested by polygon containment against the host face outline and by polygon overlap against earlier voids on the same boundary.
 * @evidence contracts/common.md#clear-and-simple-design Geometry and operation are optional members owned by the opening rather than by the boundary it cuts, so a relation-only door still validates and a boundary stays a plain separation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A void on a faceless host is refused rather than placed in an assumed plane, and a closed leaf larger than its void is refused while a smaller one is allowed for paired leaves and sashes.
 * @evidence contracts/common.md#meaningful-documentation States what a profile demands of the host, what omitting profile or operation means, the null fill meaning and that boundary and fill ids must resolve.
 */
export interface IAutoMovieBuiltOpening {
  /** Stable opening identity. */
  id: string;

  /** Open semantic label such as `door`, `window`, `arch`, or `passage`. */
  kind: string;

  /** Boundary containing this opening; it must resolve. */
  boundary: string;

  /**
   * Door, sash, gate, or other filling element, which must resolve; null for
   * an open cut.
   */
  fill: string | null;

  /**
   * The void this opening actually cuts in its host boundary's face.
   *
   * Omitting it keeps the pre-geometry record: the opening is a declared
   * relation and nothing is checked about where it is. Stating it demands the
   * host carry a {@link IAutoMovieBuiltBoundary.face}, and the void is then held
   * inside that face and apart from every other void on it.
   */
  profile?: IAutoMovieOpeningProfile;

  /**
   * Movable panels and the named states they stand in, or nothing for a fixed
   * cut such as an arch or a permanently open passage. A panel resting at its
   * element's own transform must fit inside the void.
   */
  operation?: IAutoMovieOpeningOperation;
}
