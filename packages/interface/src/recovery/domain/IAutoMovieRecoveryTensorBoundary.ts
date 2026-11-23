/**
 * Named tensor endpoint curve with its exact recipe control identities and
 * native phase intervals.
 */

export interface IAutoMovieRecoveryTensorBoundary {
  /** Saved coefficient curve identity. */
  curveName: string;

  /**
   * Ordered recipe control-ID rows; IDs retain their declared coefficient
   * ownership.
   */
  controlIds: readonly (readonly number[])[];

  /** Saved phase interval boundaries used by those recipe controls. */
  phaseIntervals: readonly number[];
}
