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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads the compiled profile at normalized spine u; results are positive finite metres and invalid profile evaluation throws.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; compileAutoMovieSweepGuide and its shared positive-profile compiler own the numerical method under the documented units and input premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; compileAutoMovieSweepGuide and its shared positive-profile compiler own executable decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by compileAutoMovieSweepGuide and its shared positive-profile compiler.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; compileAutoMovieSweepGuide and its shared positive-profile compiler own its evaluation cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; compileAutoMovieSweepGuide and its shared positive-profile compiler decide whether calls share coefficients, identities or mutable state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; compileAutoMovieSweepGuide and its shared positive-profile compiler own references retained by the supplied callable.
   */
  radius: (u: number) => number;
}
