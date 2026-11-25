/** Physical least-squares step with independent original-design diagnostics. */
export interface IAutoMovieRecoveryMapDesignFit {
  /** Owned increment in the caller's original parameter coordinates. */
  step: number[];

  /** Smallest-to-largest singular value ratio of the undamped scaled design. */
  designRatio: number;

  /** Maximum absolute column-normalized residual-gradient component. */
  gradient: number;
}
