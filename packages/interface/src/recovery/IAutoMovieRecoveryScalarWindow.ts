/**
 * Author-supplied scalar window in millimetres along a Recovery sweep.
 *
 * The lower endpoint must be less than the upper endpoint. Runtime operations
 * validate that both endpoints are finite before using the window.
 */
export interface IAutoMovieRecoveryScalarWindow {
  /** Lower endpoint, in millimetres. */
  readonly lowerMm: number;
  /** Upper endpoint, in millimetres. */
  readonly upperMm: number;
}
