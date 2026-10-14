/**
 * A canonical source sample's ordered chart: the three original source vertices it is read over and its dimensionless [u, v] coordinates, meaning originals[0] + u (originals[1] - originals[0]) + v (originals[2] - originals[0]). An original vertex repeats itself at [0, 0]; a cut point uses [t, 0].
 *
 * @evidence contracts/common.md#principled-implementation Three ordered original vertices and two affine coordinates represent originals, edge cuts and refinements through the same deterministic triangle interpolator.
 * @evidence contracts/common.md#clear-and-simple-design Fixed-size tuples express chart arity directly instead of a general curve or arbitrary vertex program.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original vertices repeat their identity at zero coordinates; cut samples use their source fraction instead of fitted spatial correspondence.
 * @evidence contracts/common.md#meaningful-documentation The comment supplies the affine formula, dimensionless coordinate units and original-versus-cut degeneracies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The fixed ordered affine-chart tuple representation are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the fixed ordered affine-chart tuple representation; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring fixed ordered affine-chart tuple representation acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceChart {
  /** Ordered original source vertex IDs of the chart's corners. */
  originals: readonly [number, number, number];

  /** Dimensionless [u, v] coordinates over those corners. */
  coordinates: readonly [number, number];
}
