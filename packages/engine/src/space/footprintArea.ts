import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";
/**
 * Plan area of the region, in square metres: the outer ring less its holes.
 *
 * Validation holds every hole strictly inside the outer ring and apart from
 * every other hole, so the subtraction cannot double-count and the result
 * cannot go negative for a record that passed. An unvalidated one is reported
 * as the arithmetic actually says rather than clamped, because a negative area
 * is a reader-visible symptom and zero would conceal that invalid region.
 *
 * @evidence contracts/common.md#principled-implementation The absolute outer shoelace area minus absolute hole areas gives planar square metres when rings are simple, holes disjoint and inside; cached binary64 double areas retain cancellation and overflow limitations.
 * @evidence contracts/common.md#clear-and-simple-design Area reads the prepared ring representation shared with containment and quantity measurement, without building triangles or substituting a convex hull.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative, non-finite or cancelling unvalidated areas propagate rather than being clamped into a plausible quantity; topology validation belongs to validateSpace.
 * @evidence contracts/common.md#meaningful-documentation States square-metre plan area, subtraction premises and invalid-input visibility; slope/height do not convert this into three-dimensional surface area.
 * @evidence contracts/performance.md#efficient-algorithms H holes require O(H) scalar subtraction and constant live storage; vertex work was already paid when each ring cached its double area.
 * @evidence contracts/performance.md#reuse-equivalent-work Cached signed areas are reused rather than recomputing vertex cross products; changed source vertices require rebuilding the footprint before quantity measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned scalar retains no footprint or temporary collection, and the caller continues to own prepared rings and their source references.
 */
export const footprintArea: (footprint: IAutoMovieFootprint) => number = (footprint: IAutoMovieFootprint): number =>
  footprint.holes.reduce(
    (area: number, hole: IAutoMovieFootprintRing): number => area - Math.abs(hole.doubleArea) / 2,
    Math.abs(footprint.outer.doubleArea) / 2,
  );
