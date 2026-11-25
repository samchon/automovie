/**
 * Type contracts exchanged by AutoMovieHumanBodyFrame; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanBodyFrame {
  /** Calibration-mm AP datums, with +X forward, +Y up and +Z left. */
  export interface IOutput {
    /** Registered C7 skin datum relative to the ankle midpoint. */
    cervicale: number;

    /** Shared lower-body sagittal datum, at the original perineal pole. */
    perineum: number;
  }
}
