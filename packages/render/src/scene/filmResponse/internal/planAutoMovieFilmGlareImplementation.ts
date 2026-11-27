import { AUTOMOVIE_FILM_GLARE_KERNELS } from "@automovie/engine";
import type { IAutoMovieFilmGlareKernel } from "../IAutoMovieFilmGlareKernel.js";

/**
 * Plan how the final pass blurs a linear frame `height` pixels tall by each
 * glare kernel: the pyramid level it is blurred at and the separable taps it
 * uses there.
 *
 * A kernel of standard deviation `σ = sigma × height` pixels is blurred at
 * level `ℓ = max(0, ⌊log₂(σ / 2)⌋)` of a pyramid whose level `ℓ` is the frame
 * box-filtered down by `2^ℓ` on each side, so it keeps at least two level
 * pixels of deviation and at most a few dozen taps whatever the raster.
 *
 * Going down and back up blurs too. With `n = 4^ℓ`, the box of width `2^ℓ` adds
 * a variance of `(n − 1) / 12` full-resolution square pixels, and the bilinear
 * read back up adds a tent of variance `n / 6`. Both are subtracted, so the
 * level deviation is `√((σ² − (n − 1) / 12 − n / 6) / n)` and the composite
 * keeps the deviation `σ` to second moment. At level zero nothing is
 * subtracted.
 *
 * The taps are the Gaussian sampled at whole level-pixel offsets out to `⌈3
 * σ_ℓ⌉` and normalized so the centre tap plus twice every other sums to one,
 * which keeps each kernel's energy exactly; `weights[0]` is the centre. The
 * blur is separable, so a pass along rows and one along columns apply the same
 * taps.
 *
 * Throws when `height` is not a positive safe integer.
 */
export function planAutoMovieFilmGlareImplementation(
  height: number,
): IAutoMovieFilmGlareKernel[] {
  if (!(height > 0))
    throw new Error(
      `A glare plan needs a positive whole frame height, got ${height}`,
    );
  return AUTOMOVIE_FILM_GLARE_KERNELS.map(
    ({
      sigma,
      weight,
    }: {
      sigma: number;
      weight: number;
    }): IAutoMovieFilmGlareKernel => {
      const deviation: number = sigma * height;
      const level: number = Math.max(0, Math.floor(Math.log2(deviation / 2)));
      const area: number = 4 ** level;
      const levelDeviation: number =
        level === 0
          ? deviation
          : Math.sqrt(
              (deviation * deviation - (area - 1) / 12 - area / 6) / area,
            );
      const radius: number = Math.max(1, Math.ceil(3 * levelDeviation));
      const raw: number[] = Array.from(
        { length: radius + 1 },
        (_: unknown, offset: number): number =>
          Math.exp((-offset * offset) / (2 * levelDeviation * levelDeviation)),
      );
      const total: number =
        raw.reduce((sum: number, value: number): number => sum + 2 * value, 0) -
        raw[0]!;
      return {
        weight,
        level,
        deviation: levelDeviation,
        weights: raw.map((value: number): number => value / total),
      };
    },
  );
}
