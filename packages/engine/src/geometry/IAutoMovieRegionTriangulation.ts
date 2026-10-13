import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionRing } from "./IAutoMovieRegionRing";

/**
 * A free-form planar region resolved into counter-clockwise triangles.
 *
 * Canonical coordinates and topology are accompanied by their original input
 * identities, so callers can retain attached data without a coordinate lookup.
 * The triangulator returns newly owned arrays and copies every input point.
 *
 * @author Samchon
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
   * Corner indices into {@link points}, three per counter-clockwise triangle.
   */
  triangles: number[];
  /** Enclosed area in square metres: the outer ring less every hole. */
  area: number;
}
