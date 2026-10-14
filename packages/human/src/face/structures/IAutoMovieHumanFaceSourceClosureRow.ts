/**
 * One sparse anchored displacement row of a compiled facial closure endpoint.
 * The transition vertex moves by the coefficient-weighted sum of its contact
 * drivers' closure displacements, axis by axis, in the performed head frame.
 * The vertex is not itself a contact point, owns at most one row, and each
 * driver is a registered contact point appearing once with a positive weight.
 *
 * @evidence contracts/common.md#principled-implementation applyHumanFaceSourceClosure moves a noncontact transition vertex from its fixed closure-one prior by the positive coefficient-weighted sum of registered pair-mean driver displacements, axis by axis.
 * @evidence contracts/common.md#clear-and-simple-design One receiving vertex and a canonical sparse driver/weight list separate transition interpolation from contact-pair ownership and the final request blend.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Plan admission rejects duplicate/nonresident transition owners, contact receivers and unsupported/repeated/nonpositive drivers; coefficients need not sum to one and supply no runtime tissue mechanics or seal certificate.
 * @evidence contracts/common.md#meaningful-documentation Performed source identity and dimensionless positive weights identify the actual anchored displacement rather than a new personal curve or position.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The row schema performs no sparse displacement accumulation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Offline coefficients are shared source data, not a runtime solve cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source owns coefficient arrays; this record acquires no endpoint buffers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSourceClosureRow {
  /** Performed source vertex receiving the displacement, never a contact point. */
  readonly vertex: number;

  /** Unique [contact driver vertex, positive dimensionless weight] pairs. */
  readonly coefficients: readonly (readonly [number, number])[];
}
