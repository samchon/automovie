import type {
  AutoMovieVector2Tuple,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";

/**
 * A registered rational quadratic arc's point at `u`, by independent Bernstein
 * evaluation of its saved controls and weight.
 */
export function evaluateRecoveryConicArc(
  arc: IAutoMovieRegisteredConicArc,
  u: number,
): Readonly<AutoMovieVector2Tuple> {
  const weights: readonly [number, number, number] = [
    (1 - u) ** 2,
    2 * arc.weight * u * (1 - u),
    u * u,
  ];
  const denominator: number = weights[0] + weights[1] + weights[2];
  return [
    (weights[0] * arc.controls[0][0] +
      weights[1] * arc.controls[1][0] +
      weights[2] * arc.controls[2][0]) /
      denominator,
    (weights[0] * arc.controls[0][1] +
      weights[1] * arc.controls[1][1] +
      weights[2] * arc.controls[2][1]) /
      denominator,
  ];
}
