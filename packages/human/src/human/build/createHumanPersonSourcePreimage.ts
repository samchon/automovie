import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonSourceChart } from "../structures/IAutoMovieHumanPersonSourceChart";
import type { IAutoMovieHumanPersonSourceWeight } from "../structures/IAutoMovieHumanPersonSourceWeight";

/**
 * The original-vertex preimage of each canonical source sample: the positive
 * affine weights of its chart's three corners, through the same scalar affine
 * owner geometry and shading use. Memoized per requested sample; the returned
 * arrays are borrowed read-only.
 */
export function createHumanPersonSourcePreimage(
  chart: (sample: number) => IAutoMovieHumanPersonSourceChart,
): (sample: number) => readonly IAutoMovieHumanPersonSourceWeight[] {
  const cache = new Map<number, readonly IAutoMovieHumanPersonSourceWeight[]>();
  return (sample) => {
    const cached = cache.get(sample);
    if (cached !== undefined) return cached;
    const one = chart(sample);
    const weights = [0, 1, 2].flatMap((corner) => {
      const weight = interpolateHumanBasisSourceTriangle(
        [corner === 0 ? 1 : 0, corner === 1 ? 1 : 0, corner === 2 ? 1 : 0],
        one.coordinates,
      );
      return weight > 0 ? [{ id: one.originals[corner], weight }] : [];
    });
    cache.set(sample, weights);
    return weights;
  };
}
