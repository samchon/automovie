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
 * @evidence contracts/common.md#principled-implementation The pose owner supplies its already-posed native prefix to replayHumanFaceSourceRefinements, which evaluates appended samples through their ordered original parent triangle with the shared source interpolation, avoiding noncommuting rest-point skinning.
 * @evidence contracts/common.md#clear-and-simple-design Generation, native prefix count, original incidence and dense appended chart order keep face-native pose correspondence separate from full-body normal/source IDs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Replay requires matching dense finite layouts, resident distinct native corners, valid parents and exact corner-alias agreement; generation matching cannot alone certify source topology, attachments, UVs or final contact.
 * @evidence contracts/common.md#meaningful-documentation Prefix/frozen-neck ownership, parent ordinal and ordered dimensionless coordinates explain which samples replay and which retain original source posing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The plan record performs no native pose or source interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared source correspondence is a reuse premise, not a performed-buffer cache here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publisher incidence/sample arrays create no posed skin or contact state.
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
