import type {
  IAutoMovieIrradianceProbe,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieSphericalBasis } from "./autoMovieSphericalBasis";

/**
 * The irradiance in lux, per RGB channel, that a probe's coefficients give a
 * receiver facing a world direction: `Σ c_lm Y_lm(n)` over the nine bands.
 *
 * The order-2 series can dip slightly below zero for a receiver facing away
 * from a bright half-space; the value is returned as computed, as the
 * renderer's shader computes it.
 *
 * @param probe The baked probe.
 * @param normal The receiver's direction; normalized here, so any finite
 *   nonzero length works.
 * @returns `[r, g, b]` irradiance in lux.
 */
export function autoMovieIrradianceOf(
  probe: Pick<IAutoMovieIrradianceProbe, "coefficients">,
  normal: IAutoMovieVector3,
): [number, number, number] {
  const length: number = Math.hypot(normal.x, normal.y, normal.z);
  const basis: number[] = autoMovieSphericalBasis(
    normal.x / length,
    normal.y / length,
    normal.z / length,
  );
  const result: [number, number, number] = [0, 0, 0];
  for (let k: number = 0; k < 9; ++k)
    for (let c: number = 0; c < 3; ++c)
      result[c] += probe.coefficients[3 * k + c]! * basis[k]!;
  return result;
}
