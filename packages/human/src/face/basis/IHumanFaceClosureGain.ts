/**
 * The closure gains one state applies per unit closure weight.
 *
 * `ratio` is the central pair's gain, applied to every closure row off the
 * lips surface and away from the fissure. `lips` holds one gain per vertex of
 * the lips surface: each margin chain vertex's solved contact gain, blending to
 * `ratio` away from the fissure.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceClosureGain pairs the central closure ratio with per-native-lip gains from legacy chains or registered material-course constraints.
 * @evidence contracts/common.md#clear-and-simple-design One record separates global off-lip response from the native lip buffer applied by the pose evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Legacy four-pass chain fitting is not convergence proof; actual margin admission and native-course verification remain with their producer, not this scalar/buffer contract.
 * @evidence contracts/common.md#meaningful-documentation Prose states per-unit closure meaning, exact lip vertex alignment and transition toward the central ratio.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record executes no solve; closure producers own chain and surface costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type schedules no work; the evaluated pose consumes the same produced gain buffer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; its owning pose retains the Float64Array until released.
 *
 * @author Samchon
 */
export interface IHumanFaceClosureGain {
  /** The central pair's gain per unit closure weight. */
  ratio: number;

  /** Gain per unit closure weight for each vertex of the lips surface. */
  lips: Float64Array;
}
