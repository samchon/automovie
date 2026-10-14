/**
 * An admitted performed source evaluation: per original parent triangle its accumulated area vector (flat triples, square metres), and each used canonical sample's performed position (metres, Y up, +Z forward). Both are owned.
 *
 * @evidence contracts/common.md#principled-implementation Admitted parent-area sums and canonical performed positions share the checked source sample namespace; matching Float32 aliases retain the first partition's Double positions.
 * @evidence contracts/common.md#clear-and-simple-design The result contains exactly the two geometry readings required by ancestral field construction and differential transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source positions are measured from the admitted performed skins, without filling missing samples from neutral geometry.
 * @evidence contracts/common.md#meaningful-documentation Documentation states owned data, square-metre parent triples and metre sample coordinates; the evaluation owner defines Float32 alias admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The owned parent-area and canonical-position evaluation results are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the owned parent-area and canonical-position evaluation results; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring owned parent-area and canonical-position evaluation results acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellEvaluation {
  /** Accumulated area vector per parent triangle, flat triples, square metres. */
  parentAreas: number[];

  /** Performed position per used canonical sample ID, metres. */
  sourcePositions: ReadonlyMap<number, readonly number[]>;
}
