import type { IAutoMovieRecoveryMapMetric } from "..";

/** Physical block step and independent original-design qualification. */
export interface IAutoMovieRecoveryMapJointStep {
  /** C physical gauge-fixed camera increments. */
  cameraStep: number[];

  /** Three physical world-coordinate increments per ordered landmark. */
  pointSteps: [number, number, number][];

  /** Undamped column-scaled reduced-camera smallest/largest singular ratio. */
  cameraDesignRatio: number;

  /** Minimum corresponding undamped three-column landmark ratio. */
  minimumPointDesignRatio: number;

  /** Maximum scaled original least-squares gradient component. */
  gradient: number;

  /** Present only when explicitly retained for the feasible consumer. */
  metric?: IAutoMovieRecoveryMapMetric;
}
