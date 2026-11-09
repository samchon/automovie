/**
 * Borrowed original-row dual of this model's qualified untilted affine QP.
 *
 * @evidence contracts/development/design.md#principled-representation Complete original affine primal/dual qualification supplies nonnegative multipliers before mixed-direction support. Selected empty arrays are a qualified zero-extended estimate; null at the callback means no qualified estimate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The generic owner lends one current Arc estimate only during the selected precommit reaction; a numerical consumer owns any admitted independent copy for its next existing model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Pure tilted weights, normal multipliers, mixed support, selected-path identity and known-solution duals do not supply this record. A lagged copy is not the next state's nonlinear KKT multiplier.
 * @evidence contracts/development/common.md#meaningful-documentation Fields give physical width, objective-inclusive row count and ordered original inequality IDs. All fields and arrays are readonly borrows for this callback only; copying requires separate owner validation and charging.
 */
export interface IAutoMovieRecoveryUntiltedEstimate {
  /** Current original physical tangent width. */
  readonly width: number;

  /** Current complete original row count, including objective row zero. */
  readonly rowCount: number;

  /** Increasing original inequality IDs, excluding zero; empty is qualified. */
  readonly selected: readonly number[];

  /** Finite nonnegative original untilted multipliers in selected-ID order. */
  readonly multipliers: readonly number[];
}
