import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A host made of several faces, as the solid operators read it: a solid already
 * merged (the base trimmed by its rails, each blend, each part trimmed by its
 * rail), so a later merge's curve and rails may cross from one face to the
 * next.
 *
 * Each face has its own chart and retained-region predicate. Boundaries may
 * come from trim cycles or original adjacent profile pieces; open boundaries
 * have no neighbor. The trace (`AutoMovieEngineSolidIntersection`) solves on one face
 * and, where its host point leaves the face's kept region, continues on the
 * neighbour from the mapped point; the host rail (`AutoMovieEngineSolidRail`) does
 * the same where its offset leaves its face. A single surface is the atlas of
 * one face whose region is all of its chart
 * (`AutoMovieEngineSolidIntersection.atlas`). Face indices must be valid for the
 * producing atlas. The interface adds no common index guard or exception
 * translation; callback failures propagate to the consuming operator's own
 * policy.
 */
export interface IAutoMovieSolidAtlas {
  /** Name in diagnostics. */
  name: string;

  /**
   * Surface identities indexed by both callbacks. Keep this ordering and all
   * source dependencies stable while a trace or rail retains the atlas;
   * readonly behavior is a caller obligation, not enforced by this mutable
   * array.
   */
  faces: IAutoMovieSolidSurface[];

  /**
   * Whether a chart point lies in a face's kept region.
   *
   * @param face The face's index.
   * @param u First coordinate in that face's own chart units, often station
   *   millimetres.
   * @param v Second coordinate in that face's own chart units, radians for
   *   lofts or a normalized profile-piece coordinate.
   * @returns True for retained skin, intended to include its boundary. Body's
   *   parity classifier does not establish inclusive ownership for every
   *   segment. A single-surface adapter always returns true; domain admission
   *   is separate.
   */
  kept(face: number, u: number, v: number): boolean;

  /**
   * The neighbour across a face's boundary nearest a chart point that lies past
   * it, and the point there that corresponds to the point's foot on the
   * boundary.
   *
   * @param face The face's index.
   * @param u First coordinate in the source face's chart units.
   * @param v Second coordinate in the source face's chart units.
   * @returns The neighbour's index and chart point, or null where the nearest
   *   boundary is an open end of the face.
   */
  across(
    face: number,
    u: number,
    v: number,
  ): {
    /** Neighbor index in this same atlas's faces array. */
    face: number;

    /** Boundary foot's first coordinate in the neighbor's chart units. */
    u: number;

    /**
     * Boundary foot's second coordinate in the neighbor's chart units,
     * preserving the producer's periodic branch.
     */
    v: number;
  } | null;
}
