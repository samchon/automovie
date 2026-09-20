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
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Resolves an outer boundary and holes into reusable geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Returns canonical points, rings, and triangles from the region operation.
 */
export interface IAutoMovieRegionTriangulation {
  /**
   * Every ring's points in one list, canonically wound: the outer ring
   * counter-clockwise first, then each hole clockwise in declared order.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Canonicalizes the winding of every region boundary.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Carries the point buffer on which ring topology is defined.
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
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Retains original boundary identities through canonical ring winding.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Maps each canonical point back to one authored outer or hole vertex without welding or adding geometry.
   */
  sourceIndices: number[];
  /**
   * Where each ring sits in {@link points}; `rings[0]` is the outer ring.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Distinguishes the outer boundary from each authored hole.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves the ring structure of the canonical region.
   */
  rings: IAutoMovieRegionRing[];
  /**
   * Corner indices into {@link points}, three per counter-clockwise triangle.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Exposes the resolved face connectivity of the planar region.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Carries the topology emitted by the triangulation operation.
   */
  triangles: number[];
  /**
   * Enclosed area in square metres: the outer ring less every hole.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Measures the actual metric area of the free-form region.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Reports a physical result derived from metric geometry inputs.
   */
  area: number;
}
