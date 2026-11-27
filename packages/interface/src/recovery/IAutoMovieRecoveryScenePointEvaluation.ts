/** Pointwise qualification against every actual retained registered measurement. */
export interface IAutoMovieRecoveryScenePointEvaluation {
  /** True only if every required pointwise gate passed. */
  accepted: boolean;

  /** Every observed failed gate. */
  reasons: string[];

  /** Largest pixel distance, null if a retained projection was unavailable. */
  maximumReprojectionPx: number | null;

  /** Smallest resolved positive camera depth, null if none resolved. */
  minimumDepth: number | null;

  /**
   * Retained source pair giving the strongest acute angle, null without two
   * rays.
   */
  supportingViews: [number, number] | null;

  /** Strongest actual acute angle in degrees, null if unresolved. */
  acuteParallaxDegrees: number | null;
}
