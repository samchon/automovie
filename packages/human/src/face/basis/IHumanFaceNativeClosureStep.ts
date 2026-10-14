/** A candidate field and its internal optimization residuals.
 * No member certifies geometry. The field owner must verify canonical posed
 * graph, actual aperture, central seats and original movement budget.
 *
 * @evidence contracts/common.md#principled-implementation solveHumanFaceNativeClosureStep returns candidate normalized gain departures and affine minimax aperture/graph-spacing residuals from its original constrained step domain.
 * @evidence contracts/common.md#clear-and-simple-design Candidate field and internal optimization residuals remain separate from the gain owner's actual graph/contact/budget verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native solver status and spacing preference certify no physical clearance or anatomical minimum; the caller must verify original posed/refined geometry.
 * @evidence contracts/common.md#meaningful-documentation Members state candidate status and internal slack meaning without geometric certification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result runs no optimization; the step/QP owners carry its costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; subsequent gain-owner reads use this exact candidate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; returned scalar/field data belongs to the candidate owner.
 *
 * @author Samchon
 */
export interface IHumanFaceNativeClosureStep {
  /** Candidate native gain departures, before actual geometric verification. */
  field: number[];

  /** Dimensionless affine aperture excess in tissue-budget units, not admitted clearance. */
  apertureSlack: number;

  /** Dimensionless graph-spacing preference, not an anatomical minimum. */
  spacingSlack: number;
}
