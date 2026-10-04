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
 * @evidence contracts/common.md#principled-implementation Affine replay after native posing preserves the performed source definition despite the noncommutation of mixed attachment transforms and rest-space interpolation.
 * @evidence contracts/common.md#clear-and-simple-design A native count/topology and one dense chart per appended vertex define the replay order without a second skinning policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-person coordinates or exceptional vertex indices are encoded; generation and prefix compatibility require actual consumer checks.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes native face count from full-body provenance, states posing/contact order, ownership and unverified correspondence limits.
 * @evidence contracts/modeling.md#spatial-conventions Counts and indices are dimensionless; chart coordinates are dimensionless and posed components retain the face's metre frame.
 * @evidence contracts/modeling.md#shared-boundaries Derived vertices and aliases evaluate the same native chart after performance, while existing native neck samples keep their previous owner and pose definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This binding record defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels Source coordinates are compiled shared correspondence, not authored person channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record binds an existing refinement population; its source compiler owns emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face pose/contact consumer owns observation of the replayed surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This mathematical binding establishes no anatomical value, proportion or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range A source chart's domain is not a physiological motion range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This offline plan introduces no person-authoring vertex input.
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
  readonly samples: readonly {
    readonly parent: number;
    readonly coordinates: readonly [number, number];
  }[];
}
