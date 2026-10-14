/**
 * One original source vertex in a sample's affine preimage: its ID and its dimensionless positive weight. The chart defines a partition of unity; emitted floating coefficients are not separately renormalized or certified to sum to exactly one in binary arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation Positive coefficients over original source IDs project the admitted two-coordinate affine chart; partition of unity is its mathematical convention, while floating evaluation is neither renormalized nor given an exact-sum certificate here.
 * @evidence contracts/common.md#clear-and-simple-design One ID and one dimensionless coefficient suffice for sparse preimages, avoiding allocation over unused original vertex IDs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source IDs are supplied by admitted charts rather than a hardcoded vertex population for one body.
 * @evidence contracts/common.md#meaningful-documentation The comment states positivity, dimensionless weighting, chart partition of unity and the limit of exact floating-sum claims.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Sparse coefficient records do not choose the preimage algorithm; the shared affine evaluator computes their values.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single coefficient neither identifies requests nor caches them; the preimage factory memoizes whole requested samples.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No resource is acquired by an affine term; the returned preimage array owns its ordinary numeric records.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceWeight {
  /** Original source vertex ID. */
  id: number;

  /** Dimensionless positive affine weight of that vertex. */
  weight: number;
}
