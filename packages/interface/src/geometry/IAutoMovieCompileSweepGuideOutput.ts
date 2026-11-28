/** A compiled guide's wrapped polar angle and metre radius evaluator. */
export interface IAutoMovieCompileSweepGuideOutput {
  /**
   * Wrapped finite guide direction in radians in [0, 2?), starting from the
   * section's first axis.
   */
  angle: number;

  /**
   * Chord-coordinate evaluator of the guide's metre radius. Supply a finite
   * coordinate and keep the profile within a positive finite range.
   */
  radius: (u: number) => number;
}
