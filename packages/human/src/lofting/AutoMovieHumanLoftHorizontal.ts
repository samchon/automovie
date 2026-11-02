import { AutoMovieHumanLoftChain as Loft } from "./AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain as Chain } from "./IAutoMovieHumanLoftChain";

/** Actual world-horizontal cuts through unframed analytic lofts, including lift. */
export namespace AutoMovieHumanLoftHorizontal {
  /** A point in world millimetres. */
  export type Vec3 = [number, number, number];

  /**
   * Sample the actual surface's crossings of world height, not a material
   * course's projection. Each source course must advance monotonically in Y
   * at a phase; folds are invalid for this trunk measurement construction.
   * Adjacent owners may contribute different phase subsets at a tilted seam.
   */
  export function points(chains: readonly Chain[], height: number, count: number): Vec3[] {
    const phases: number[] = Array.from({ length: count }, (_: unknown, i: number): number => 2 * Math.PI * i / count);
    const result: Vec3[] = [];
    for (const chain of chains) {
      if (chain.layers.some((layer: Chain.ILayer): boolean => layer.frame !== undefined))
        throw new Error("A trunk horizontal cut requires unframed surface owners");
      const bottom: number = chain.layers[0]!.y;
      const top: number = chain.layers[chain.layers.length - 1]!.y;
      const flat: boolean = chain.layers.every((layer: Chain.ILayer): boolean => [layer.lift, layer.liftSlopes, layer.liftCurvatures].every((values: readonly number[] | undefined): boolean => values === undefined || values.every((value: number): boolean => value === 0)));
      if (flat) {
        if (height >= bottom && height <= top) result.push(...Loft.ring(chain, height, phases));
        continue;
      }
      const first: Vec3[] = Loft.ring(chain, bottom, phases);
      const last: Vec3[] = Loft.ring(chain, top, phases);
      for (let j: number = 0; j < count; j++) {
        if (first[j]![1] > height || last[j]![1] < height) continue;
        let low: number = bottom;
        let high: number = top;
        let station: number = Math.max(low, Math.min(high, height));
        let converged: boolean = false;
        for (let iteration: number = 0; iteration < 32; iteration++) {
          const here: Vec3 = Loft.ring(chain, station, [phases[j]!])[0]!;
          const error: number = here[1] - height;
          if (Math.abs(error) < 1e-7) {
            result.push(here);
            converged = true;
            break;
          }
          if (error < 0) low = station;
          else high = station;

          // A safeguarded Newton step uses the actual Y derivative. The
          // finite difference is a solver aid, never a substitute surface.
          const before: number = Math.max(bottom, station - 0.01);
          const after: number = Math.min(top, station + 0.01);
          const slope: number = (Loft.ring(chain, after, [phases[j]!])[0]![1] - Loft.ring(chain, before, [phases[j]!])[0]![1]) / (after - before);
          const trial: number = station - error / slope;
          station = slope > 0 && trial > low && trial < high ? trial : (low + high) / 2;
        }
        if (!converged) throw new Error("A lifted trunk course did not cross the declared plane monotonically");
      }
    }
    return result;
  }
}
