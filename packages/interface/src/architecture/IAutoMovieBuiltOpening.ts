import type { IAutoMovieOpeningOperation } from "./IAutoMovieOpeningOperation";
import type { IAutoMovieOpeningProfile } from "./IAutoMovieOpeningProfile";

/**
 * One traversable or visible opening through a boundary.
 *
 * An opening is a relation first: it names the boundary it pierces and the
 * element that fills it. The void's geometry and the fill's movement are
 * optional layers on that relation, and each one stated is checked by
 * `validateBuiltEnvironment` against the host face and the other voids on it.
 */
export interface IAutoMovieBuiltOpening {
  /** Stable opening identity, unique among the environment's openings. */
  id: string;

  /** Non-blank open label such as `door`, `window`, `arch`, or `passage`. */
  kind: string;

  /** Boundary this opening pierces; it must resolve. */
  boundary: string;

  /**
   * Door, sash, gate, or other filling element, which must resolve; null for an
   * open cut. A stated {@link operation} requires a fill, because its panels
   * must be that element or descend from it.
   */
  fill: string | null;

  /**
   * The void this opening cuts in its host boundary's face.
   *
   * Omitting it leaves no authored void for face fit or separation measurement;
   * other consumers can still locate a measurable fill from its element
   * geometry. Stating it requires a host {@link IAutoMovieBuiltBoundary.face}
   * and an admitted straight arc-envelope hull inside that face and disjoint
   * from other opening hulls on the same boundary, with edge contact refused.
   */
  profile?: IAutoMovieOpeningProfile;

  /**
   * Movable panels and the named states they stand in, or nothing for a fixed
   * cut such as an arch or a permanently open passage. Each panel at rest, at
   * its element's own transform with no state travel applied, must fit inside
   * the void once projected into the host face; how far it sits in front of or
   * behind the face is free.
   */
  operation?: IAutoMovieOpeningOperation;
}
