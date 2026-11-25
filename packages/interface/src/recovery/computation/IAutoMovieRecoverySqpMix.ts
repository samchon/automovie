/** One nominal or numerically supported physical mixture, without a QP claim. */
export interface IAutoMovieRecoverySqpMix {
  /** Owned physical direction, null if neither bounded candidate was supported. */
  step: number[] | null;

  /** Last candidate's coefficient of the original tilted direction. */
  weight: number;

  /** Whether the nominal candidate needed a segment-support calculation. */
  numericalAttempted: boolean;

  /** Whether that single supported candidate passed the original raw signs. */
  numericalSupported: boolean;
}
