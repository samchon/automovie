import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionRing } from "./IAutoMovieRegionRing";

/**
 * A free-form planar region resolved into counter-clockwise triangles, as
 * `triangulateAutoMovieRegion` returns it.
 *
 * Canonical coordinates and topology are accompanied by their original input
 * identities, so callers can retain attached data without a coordinate lookup.
 * The triangulator returns newly owned arrays and copies every input point.
 * Ear clipping keeps every canonical point; a hole bridge repeats two indices
 * in `triangles` but adds no point.
 *
 * @evidence contracts/development/design.md#principled-representation `canonicalRegion` validates the rings with `autoMoviePlanarRegionFailure` and rewinds them by signed area, then `trianglesOf` bridges each hole and ear-clips the single ring, refusing when no valid ear exists, so the triangles cover exactly the enclosed area with no added vertex.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Points, their source indices, ring spans, triangles and area in one record, because the oral assembly and skin annulus carry attribute data through `sourceIndices` while extrusion and loft read the spans, and none of them recomputes the layout.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid rings are refused with their own diagnostic rather than repaired, and winding is normalized by reversal only, which changes order but never identity, so `sourceIndices` stays a permutation.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the canonical winding and ring order, ownership of every array, the permutation meaning of `sourceIndices`, the triangle orientation and index target, and the area's unit and sign rule.
 */
export interface IAutoMovieRegionTriangulation {
  /**
   * Every ring's points in one list, canonically wound: the outer ring
   * counter-clockwise first, then each hole clockwise in declared order.
   */
  points: IAutoMovieProfilePoint[];

  /**
   * Original input index for each canonical point. Flatten the authored outer
   * ring followed by holes in their supplied order, keeping each original ring
   * order. `sourceIndices[k]` addresses that flattened input for `points[k]`.
   * This is an integer permutation, not a distance or a triangle index. No
   * vertex is added or merged by winding normalization. It permits attachment
   * IDs, exact coordinates in another unit and other attributes to follow the
   * same permutation without reconstructing identity from floating-point XY.
   */
  sourceIndices: number[];

  /** Where each ring sits in {@link points}; `rings[0]` is the outer ring. */
  rings: IAutoMovieRegionRing[];

  /**
   * Corner indices into {@link points}, three per counter-clockwise triangle,
   * so the region faces +Z.
   */
  triangles: number[];

  /**
   * Enclosed area in square metres: the outer ring less every hole, always
   * positive for an admitted region.
   */
  area: number;
}
