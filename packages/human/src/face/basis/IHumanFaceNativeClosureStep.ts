/** A candidate field and its internal optimization residuals.
 * No member certifies geometry. The field owner must verify canonical posed
 * graph, actual aperture, central seats and original movement budget.
 *
 * @evidence contracts/common.md#principled-implementation Separates native variables from optimization slacks and retains their candidate status.
 * @evidence contracts/common.md#clear-and-simple-design One field vector and two scalar residuals describe a step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Solver output cannot masquerade as admitted geometry.
 * @evidence contracts/common.md#meaningful-documentation States candidate status and original downstream verification.
 * @evidence contracts/modeling.md#spatial-conventions Variables and both slacks use dimensionless original-budget units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The field owner defines closure meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The field owner validates its courses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly observes its field.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no clinical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Solver residuals establish no permitted range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
 * @author Samchon
 */
export interface IHumanFaceNativeClosureStep {
  /** Candidate native gain departures, before actual geometric verification. */
  field: number[];

  /** Internal maximum affine aperture violation, not an admitted clearance. */
  apertureSlack: number;

  /** Internal graph-spacing preference, not an anatomical minimum. */
  spacingSlack: number;
}
