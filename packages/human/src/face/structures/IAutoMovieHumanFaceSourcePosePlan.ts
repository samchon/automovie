import type { IAutoMovieHumanBasisSourceChartPoint } from "../../common/basis/IAutoMovieHumanBasisSourceChartPoint";

/**
 * Compiled replay of facial refinement points after their native source poses.
 * The native prefix is the original face surface, including any already-frozen
 * neck samples. Its source posing remains unchanged. Additional oral points
 * and contact aliases read that posed prefix through the ordered native chart.
 *
 * Interpolating attachment weights and posing an interpolated rest point do
 * not generally commute with interpolation of the posed source vertices.
 * The face consumer therefore poses the native points first, replays these
 * derived samples with interpolateHumanBasisSourceTriangle, then performs
 * contact resolution. The normal partition's full-body source IDs are not a
 * substitute for this face-native posing domain.
 *
 * This is offline shared-source data, not personal vertex authoring. The
 * consumer validates counts, indices, chart support and dense ordered bindings;
 * a generation label alone cannot establish native-prefix correspondence.
 * Geometry, targets, attachments and UVs retain separate preparation checks.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSourcePosePlan {
  /** Shared compiler generation; must match a supplied sourcePartition plan. */
  readonly generation: string;

  /** Count of retained native prefix vertices, including prior neck cut samples. */
  readonly nativeVertices: number;

  /** Original oriented native face index triples over [0, nativeVertices). */
  readonly nativeTriangles: readonly number[];

  /**
   * Dense appended-point order: entry i owns vertex nativeVertices+i. Its parent
   * is a nativeTriangles ordinal and coordinates [u,v] use that triangle's
   * ordered corners. Exact corners and edges also represent source aliases.
   */
  readonly samples: readonly IAutoMovieHumanBasisSourceChartPoint[];
}
