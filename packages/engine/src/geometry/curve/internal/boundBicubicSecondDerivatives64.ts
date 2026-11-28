import type { AutoMovieBernsteinGrid64 } from "@automovie/interface";

import { AutoMovieEngineCurveMath64 as V } from "../../AutoMovieEngineCurveMath64";

/* Estimate the Taylor contributions of a unit bicubic parameter cell. */
export function boundBicubicSecondDerivatives64(
  grid: AutoMovieBernsteinGrid64,
): [number, number, number] {
  let uu: number = 0;
  let uv: number = 0;
  let vv: number = 0;
  // Bernstein differentiation gives the pure factors 3 × 2 and mixed 3 × 3.
  // Each derivative lies in the convex hull of its difference coefficients.
  for (let row: number = 0; row < 4; ++row)
    for (let column: number = 0; column < 2; ++column)
      uu = Math.max(
        uu,
        6 *
          Math.hypot(
            ...V.add(
              V.sub(
                grid[row]![column + 2]!,
                V.scale(grid[row]![column + 1]!, 2),
              ),
              grid[row]![column]!,
            ),
          ),
      );
  for (let row: number = 0; row < 2; ++row)
    for (let column: number = 0; column < 4; ++column)
      vv = Math.max(
        vv,
        6 *
          Math.hypot(
            ...V.add(
              V.sub(
                grid[row + 2]![column]!,
                V.scale(grid[row + 1]![column]!, 2),
              ),
              grid[row]![column]!,
            ),
          ),
      );
  for (let row: number = 0; row < 3; ++row)
    for (let column: number = 0; column < 3; ++column)
      uv = Math.max(
        uv,
        9 *
          Math.hypot(
            ...V.sub(
              V.sub(grid[row + 1]![column + 1]!, grid[row + 1]![column]!),
              V.sub(grid[row]![column + 1]!, grid[row]![column]!),
            ),
          ),
      );
  if (![uu, uv, vv].every(Number.isFinite))
    throw new Error("nonfinite tensor derivative estimate");
  // Unit-cell pure and mixed interpolation errors have these Taylor weights.
  return [uu / 8, uv / 4, vv / 8];
}
