import type { IAutoMovieQuadraticRow } from "@automovie/engine";

/** The original affine field constraints and the nonlinear-contact partition.
 * Contact rows are local linearizations; every other row remains hard in the
 * step solver. Aperture residuals use the caller's original budget units.
 *
 * @evidence contracts/common.md#principled-implementation Original affine field rows plus an explicit nonlinear-contact interval distinguish relaxable linearized aperture rows from hard gain/central/graph conditions.
 * @evidence contracts/common.md#clear-and-simple-design Variable count and half-open row partition let one step solver preserve original hard rows without recreating physical contact policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elastic residuals use original normalized budget units and cannot add physical acceptance slack; row/column validity remains the caller/shared QP admission responsibility.
 * @evidence contracts/common.md#meaningful-documentation Members explain gain/slack column layout and inclusive/exclusive contact bounds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input solves nothing; the step solver owns row splitting and native optimization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no requests; the step retains original hard rows across its two phases.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; borrowed rows belong to the gain-owner iteration.
 *
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
