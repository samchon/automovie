import type { IAutoMovieQuadraticRow } from "@automovie/engine";

/** The original affine field constraints and the nonlinear-contact partition.
 * Contact rows are local linearizations; every other row remains hard in the
 * step solver. Aperture residuals use the caller's original budget units.
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
