import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The root directions as a Fibonacci lattice over the head chart's unit
 * sphere about its centre (Gonzalez 2010, "Measurement of areas on a sphere
 * using Fibonacci and latitude-longitude lattices"): points spaced almost
 * evenly by solid angle with no seam or pole cluster. Point `k` of `n` has
 * height `1 - 2 (k + 0.5) / n` and azimuth `k` golden angles. Whether a
 * point is kept, and its mirror, belong to `AutoMovieHumanHairRootMirror`.
 */
export namespace AutoMovieHumanHairRootLattice {
  /** One lattice point. */
  export interface IPoint {
    /** Lattice index, the root's stable seed. */
    seed: number;

    /** Unit direction from the chart centre. */
    u: AutoMovieHumanSkinVector.Vec3;
  }

  /**
   * The lattice of `count` points.
   *
   * @param count Number of points
   * @returns Points in lattice order
   */
  export function points(count: number): IPoint[] {
    const golden: number = Math.PI * (3 - Math.sqrt(5));
    const out: IPoint[] = [];
    for (let k: number = 0; k < count; ++k) {
      const y: number = 1 - (2 * (k + 0.5)) / count;
      const r: number = Math.sqrt(1 - y * y);
      out.push({
        seed: k,
        u: [r * Math.cos(k * golden), y, r * Math.sin(k * golden)],
      });
    }
    return out;
  }
}
