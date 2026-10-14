/**
 * The lowest primary relative-residual merit encountered during one head solve, with copied trial weights and the corresponding metre readings. It is an observed numerical candidate, not a proof of feasibility, global optimum or clinical head likeness.
 *
 * @evidence contracts/common.md#principled-implementation One actual evaluated trial pairs primary squared relative residual with its exact channel weights and ordered head readings.
 * @evidence contracts/common.md#clear-and-simple-design The candidate retains only solver diagnostic operands while search, instrument evaluation and final admission stay with the solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lowest encountered merit is not declared a global optimum or certified anatomical fit; secondary readings do not enter primary merit.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish dimensionless primary merit, dimensionless ordered weights and metre readouts from numerical guarantees.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This candidate record runs no residual calculation or bounded search; the head solver owns those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Paired trial data implements no measurement cache or solver request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no geometry or instrument task; actual solver state owns candidate arrays for its call lifetime.
 *
 * @author Samchon
 */
export interface IHumanPersonHeadCandidate {
  /** Sum of squared relative residuals of the primary measurements. */
  merit: number;

  /** Channel weights in the solve's channel order. */
  weights: number[];

  /** Head readings at those weights, metres, in the solve's reading order. */
  readings: number[];
}
