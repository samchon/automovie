/**
 * Wrapped direction and its independently compiled radius profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A wrapped angle in [0,2*pi) radians accompanies a radius query at normalized spine u returning positive finite metres. The callback rejects invalid profile results; the structural signature alone cannot guarantee finite query arguments or positive radii.
 * @evidence contracts/development/design.md#principled-representation A wrapped angle in [0,2*pi) radians accompanies a radius query at normalized spine u returning positive finite metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieSweepGuide creates the profile retained by compiled sweep radius evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback rejects invalid profile results; the structural signature alone cannot guarantee finite query arguments or positive radii.
 */
export interface IAutoMovieCompileSweepGuideOutput {
  /** Radians in one turn. */
  angle: number;

  /**
   * Radius in metres, positive and finite at a successful query.
   */
  radius: (u: number) => number;
}
