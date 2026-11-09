/**
 * Two pinhole derivatives in one observation's current local camera/point chart.
 *
 * @evidence contracts/development/design.md#principled-representation Analytic quotient and SO3/general-normalization chain rules give the map chart's numerical pullback in Float64. The seed uses r*normalize(t+Bz) at current t and fixed r=norm(t), sharing the actual first derivative P_t B. The last three coordinates are the world point; the preceding zero, five or six coordinates belong to its camera.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One fixed-size observation record supplies local Lagrangian assembly without retaining an observation history or changing original first-derivative certification.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These numerical second derivatives do not replace physical rows, finite first derivatives do not certify second-order support, and no unit-basis identity is imposed on approximate Float inputs.
 * @evidence contracts/development/common.md#meaningful-documentation Members give original pixels, local coordinate order and symmetric per-pixel Hessians. Null at the producer means optional arithmetic support is absent; malformed chart ownership is an exception.
 */
export interface IAutoMovieRecoveryMapLocalCurvature {
  /** Original calibrated pixel coordinates. */
  pixel: [number, number];

  /** Two local derivative rows, with the world-point coordinates last. */
  jacobian: number[][];

  /** Two symmetric local Hessians in the identical coordinate order. */
  hessians: number[][][];
}
