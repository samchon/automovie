/**
 * Two pinhole derivatives in one observation's current local camera/point chart.
 *
 * @evidence contracts/common.md#principled-implementation Analytic quotient and SO3/general-normalization chain rules give a numerical pullback approximation in Float64. The seed is anchored at current t through t+normalize(t+Bz)-normalize(t), rather than moving approximately unit input at zero. The last three coordinates are the world point; the preceding zero, five or six coordinates belong to its camera.
 * @evidence contracts/common.md#clear-and-simple-design One fixed-size observation record supplies local Lagrangian assembly without retaining an observation history or changing original first-derivative certification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These numerical second derivatives do not replace physical rows, finite first derivatives do not certify second-order support, and no unit-basis identity is imposed on approximate Float inputs.
 * @evidence contracts/common.md#meaningful-documentation Members give original pixels, local coordinate order and symmetric per-pixel Hessians. Null at the producer means optional arithmetic support is absent; malformed chart ownership is an exception.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased output performs no geometry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cross-observation cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most two9x9 Hessians, two9-coordinate first derivatives and two pixels transfer for one observation. The formation owner releases them after scattering into admitted arrowhead blocks.
 */
export interface IAutoMovieRecoveryMapLocalCurvature {
  /** Original calibrated pixel coordinates. */
  pixel: [number, number];

  /** Two local derivative rows, with the world-point coordinates last. */
  jacobian: number[][];

  /** Two symmetric local Hessians in the identical coordinate order. */
  hessians: number[][][];
}
