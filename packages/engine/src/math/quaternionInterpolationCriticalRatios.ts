import { IAutoMovieQuaternion } from "@automovie/interface";

import { QUATERNION_NLERP_DOT_THRESHOLD } from "./constants/QUATERNION_NLERP_DOT_THRESHOLD";

/**
 * Interior ratios where a component of Quaternion.slerp is stationary.
 *
 * Inputs are admitted finite, nearly unit quaternion keys. A negative endpoint dot negates the second quaternion for the shorter arc. The near-parallel branch shares the sampler's threshold and equality rule. Endpoints and one-sided key boundaries remain the caller's checks; roots have floating precision.
 *
 * @evidence contracts/common.md#principled-implementation Spherical components are A cos(theta*t)+B sin(theta*t), with derivative roots atan2(B,A) modulo pi. Differentiating normalized lerp (a_i+t*d_i)/sqrt(a·a+2t*a·d+t²*d·d) leaves a linear numerator with one root. Finite nearly-unit keys admitted by track validation and shorter-arc negation keep normalization positive; admission tolerances and ordinary floating rounding remain in the curve and roots.
 * @evidence contracts/common.md#clear-and-simple-design Owns stationary ratios for the existing interpolation law; the shared dot threshold matches Quaternion.slerp while film admission owns clocks, clip authority and profiles. No renderer or sampled grid is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every component follows the same derivative without fixture or profile cases; endpoint negation and the near-parallel boundary follow the sampler, while boundary or outside roots are not clamped into interior samples.
 * @evidence contracts/common.md#meaningful-documentation States finite admitted-key premises, shorter-arc representation, branch equality, boundary ownership and floating precision; the result contains distinct ratios strictly between zero and one.
 * @evidence contracts/performance.md#efficient-algorithms Constant work over four components gives at most four distinct roots, without duration-dependent density or iterative search; branch coefficients and dot products are shared across components.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computes one current endpoint pair and coordinates no requests or effects; no result is cached across mutable tracks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds two fixed component arrays and at most four ratios during the call, transfers the result array to its caller and retains no state or resources.
 */
export function quaternionInterpolationCriticalRatios(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number[] {
  const left: number[] = [a.x, a.y, a.z, a.w];
  const right: number[] = [b.x, b.y, b.z, b.w];
  let dot: number = left.reduce((sum: number, component: number, index: number): number => sum + component * right[index]!, 0);
  if (dot < 0) {
    dot = -dot;
    for (let index: number = 0; index < 4; index++) right[index] = -right[index]!;
  }
  const ratios: Set<number> = new Set();
  function keep(ratio: number): void {
    if (Number.isFinite(ratio) && ratio > 0 && ratio < 1) ratios.add(ratio);
  }
  if (dot > QUATERNION_NLERP_DOT_THRESHOLD) {
    const difference: number[] = right.map((component: number, index: number): number => component - left[index]!);
    const aa: number = left.reduce((sum: number, component: number): number => sum + component * component, 0);
    const ad: number = left.reduce((sum: number, component: number, index: number): number => sum + component * difference[index]!, 0);
    const dd: number = difference.reduce((sum: number, component: number): number => sum + component * component, 0);
    for (let index: number = 0; index < 4; index++) {
      const denominator: number = difference[index]! * ad - left[index]! * dd;
      if (denominator !== 0) keep((left[index]! * ad - difference[index]! * aa) / denominator);
    }
  } else {
    const theta: number = Math.acos(dot);
    const sine: number = Math.sin(theta);
    for (let index: number = 0; index < 4; index++) {
      const cosineCoefficient: number = left[index]!;
      const sineCoefficient: number = (right[index]! - cosineCoefficient * dot) / sine;
      let angle: number = Math.atan2(sineCoefficient, cosineCoefficient);
      if (angle <= 0) angle += Math.PI;
      keep(angle / theta);
    }
  }
  return [...ratios];
}
