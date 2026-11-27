import { IAutoMovieQuaternion } from "@automovie/interface";

import { AutoMovieEngineQuaternionNlerpDotThreshold } from "../AutoMovieEngineQuaternionNlerpDotThreshold";

/*
 * Interior ratios where a component of Quaternion.slerp is stationary.
 *
 * Inputs are admitted finite, nearly unit quaternion keys. A negative endpoint
 * dot negates the second quaternion for the shorter arc. The near-parallel
 * branch shares the sampler's threshold and equality rule. Endpoints and
 * one-sided key boundaries remain the caller's checks; roots have floating
 * precision.
 */
export function quaternionInterpolationCriticalRatios(
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): number[] {
  const left: number[] = [a.x, a.y, a.z, a.w];
  const right: number[] = [b.x, b.y, b.z, b.w];
  let dot: number = left.reduce(
    (sum: number, component: number, index: number): number =>
      sum + component * right[index]!,
    0,
  );
  if (dot < 0) {
    dot = -dot;
    for (let index: number = 0; index < 4; index++)
      right[index] = -right[index]!;
  }
  const ratios: Set<number> = new Set();
  function keep(ratio: number): void {
    if (ratio > 0 && ratio < 1) ratios.add(ratio);
  }
  if (dot > AutoMovieEngineQuaternionNlerpDotThreshold) {
    const difference: number[] = right.map(
      (component: number, index: number): number => component - left[index]!,
    );
    const aa: number = left.reduce(
      (sum: number, component: number): number => sum + component * component,
      0,
    );
    const ad: number = left.reduce(
      (sum: number, component: number, index: number): number =>
        sum + component * difference[index]!,
      0,
    );
    const dd: number = difference.reduce(
      (sum: number, component: number): number => sum + component * component,
      0,
    );
    for (let index: number = 0; index < 4; index++) {
      const denominator: number = difference[index]! * ad - left[index]! * dd;
      if (denominator !== 0)
        keep((left[index]! * ad - difference[index]! * aa) / denominator);
    }
  } else {
    const theta: number = Math.acos(dot);
    const sine: number = Math.sin(theta);
    for (let index: number = 0; index < 4; index++) {
      const cosineCoefficient: number = left[index]!;
      const sineCoefficient: number =
        (right[index]! - cosineCoefficient * dot) / sine;
      let angle: number = Math.atan2(sineCoefficient, cosineCoefficient);
      if (angle <= 0) angle += Math.PI;
      keep(angle / theta);
    }
  }
  return [...ratios];
}
