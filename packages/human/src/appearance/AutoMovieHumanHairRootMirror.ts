import type { AutoMovieHumanHairRootLattice } from "./AutoMovieHumanHairRootLattice";
import type { AutoMovieHumanHairRoots } from "./AutoMovieHumanHairRoots";

/**
 * Roots built on the canonical side (+Z, the person's left) and reflected by
 * `z -> -z`: the lattice points more than a quarter of the lattice spacing
 * from the midline are kept and each reflected; the points nearer the
 * midline are left out, so no two roots stand nearly on top of each other
 * there and no root stands on a midline parting, where hair has no side to
 * fall to: roots moved onto the midline swept neither way, fell over the
 * forehead and down the face, and stood up at the vertex. The band left out
 * is half a lattice spacing wide, narrower than any card (convention). A
 * root and its mirror share one seed, so every jitter, length and phase
 * drawn from it mirrors.
 */
export namespace AutoMovieHumanHairRootMirror {
  /**
   * Keep the canonical half and add its reflection.
   *
   * @param points The lattice points
   * @param count The lattice size, for its spacing
   * @returns Roots, each canonical one followed by its mirror
   */
  export function reflect(
    points: AutoMovieHumanHairRootLattice.IPoint[],
    count: number,
  ): AutoMovieHumanHairRoots.IRoot[] {
    const band: number = 0.25 * Math.sqrt((4 * Math.PI) / count);
    const roots: AutoMovieHumanHairRoots.IRoot[] = [];
    for (const point of points) {
      const [x, y, z]: [number, number, number] = point.u;
      if (z < band) continue;

      roots.push({
        index: 2 * point.seed,
        seed: point.seed,
        mirror: false,
        u: [x, y, z],
      });
      roots.push({
        index: 2 * point.seed + 1,
        seed: point.seed,
        mirror: true,
        u: [x, y, -z],
      });
    }
    return roots;
  }
}
