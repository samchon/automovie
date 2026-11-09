import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";

/**
 * A surface's plan region: the outer ring, and the holes cut out of it.
 *
 * @evidence contracts/development/design.md#principled-representation The outer ring and separate void rings preserve concavity and holes; footprintContains includes their tolerance-qualified rims, while footprintArea subtracts absolute shoelace areas under validated disjoint-inside-hole premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Region topology is represented once for area, containment and decomposition rather than replaced by a convex hull that would fill notches or atria.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Holes are explicit authored geometry, not negative fixture masks; unvalidated overlapping or outside holes can produce invalid area and are not repaired by this type.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies outer/void roles and an empty holes list; readonly references do not protect borrowed authored point objects from external mutation.
 */
export interface IAutoMovieFootprint {
  /** The ring that bounds the region. */
  readonly outer: IAutoMovieFootprintRing;

  /** Voids cut in {@link outer}; empty for a solid patch. */
  readonly holes: readonly IAutoMovieFootprintRing[];
}
