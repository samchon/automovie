import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";

/**
 * A surface's plan region: the outer ring, and the holes cut out of it.
 *
 * @evidence contracts/common.md#principled-implementation The outer ring and separate void rings preserve concavity and holes; footprintContains includes their tolerance-qualified rims, while footprintArea subtracts absolute shoelace areas under validated disjoint-inside-hole premises.
 * @evidence contracts/common.md#clear-and-simple-design Region topology is represented once for area, containment and decomposition rather than replaced by a convex hull that would fill notches or atria.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Holes are explicit authored geometry, not negative fixture masks; unvalidated overlapping or outside holes can produce invalid area and are not repaired by this type.
 * @evidence contracts/common.md#meaningful-documentation Identifies outer/void roles and an empty holes list; readonly references do not protect borrowed authored point objects from external mutation.
 * @evidence contracts/performance.md#efficient-algorithms Storage follows E total ring vertices and H hole records; containment reads at most all E edges and area folds H cached double areas.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared projections and signed areas serve repeated region queries until authored vertices change; preparation must be repeated after mutation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns prepared arrays and retains the borrowed source vertices through each ring; discarding the footprint releases those references without a host resource.
 * @author Samchon
 */
export interface IAutoMovieFootprint {
  /** The ring that bounds the region. */
  readonly outer: IAutoMovieFootprintRing;

  /** Voids cut in {@link outer}; empty for a solid patch. */
  readonly holes: readonly IAutoMovieFootprintRing[];
}
