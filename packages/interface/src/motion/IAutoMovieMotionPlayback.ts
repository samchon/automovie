/**
 * An already constructed motion evaluated at a second on its own clock.
 * The producer defines the value and valid times. Seeking and reordering
 * reads return the same value for the same inputs and placed state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the local clock, arbitrary seeking and output ownership.
 * @evidence contracts/development/design.md#principled-representation Seconds identify the requested motion value independently of frame rate, subject type and placement. The caller supplies any observation inputs the evaluator declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One callable serves a rigid transform, articulation scalar, shape or pose. Finite human phases specialize it with their own validity intervals.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type implies no global contact partition, integrator, interpolation choice or correctness bound from samples.
 */
export interface IAutoMovieMotionPlayback<
  TSample,
  TArguments extends readonly [seconds: number, ...context: unknown[]] = [seconds: number],
> {
  /**
   * Evaluate the requested local second using the producer's prepared motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The evaluator works on the producer's local clock and returns its declared sample, including any ordinary fallback its domain defines.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The signature declares the clock input and sample type. The producer supplies the evaluation law.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The provider owns decomposition. Human phase selection uses HumanPreparedPlayback.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The producer establishes its numerical premises and admits the requested time.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer chooses the sample evaluation and owns its cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The evaluator's producer decides which prepared inputs its calls can share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The provider owns its preparation and sample lifetime.
   */
  readonly sample: (...args: TArguments) => TSample;
}
