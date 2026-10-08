import type { IAutoMovieQuadraticRow } from "@automovie/engine";

/** The original affine field constraints and the nonlinear-contact partition.
 * Contact rows are local linearizations; every other row remains hard in the
 * step solver. Aperture residuals use the caller's original budget units.
 *
 * @evidence contracts/common.md#principled-implementation Explicit row boundaries distinguish original hard constraints from local nonlinear contact models.
 * @evidence contracts/common.md#clear-and-simple-design One borrowed row population and its variable/domain partition describe a closure step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries original rows without changing physical endpoints.
 * @evidence contracts/common.md#meaningful-documentation Names linearization ownership and normalized residual units.
 * @evidence contracts/modeling.md#spatial-conventions Rows and internal slack use dimensionless tissue-budget units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The closure owner defines the channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The field owner measures the contact courses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly observes the field.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no clinical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range The field owner enforces original physical limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
 * @author Samchon
 */
export interface IHumanFaceNativeClosureStepInput {
  /** Original affine rows, including field bounds and spacing-slack domain. */
  rows: readonly IAutoMovieQuadraticRow[];

  /** Native gain variable count; the following column is graph spacing slack. */
  variables: number;

  /** Inclusive first nonlinear-contact row. */
  contactStart: number;

  /** Exclusive final nonlinear-contact row. */
  contactEnd: number;
}
