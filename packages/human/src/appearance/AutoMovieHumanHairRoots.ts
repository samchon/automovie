import { AutoMovieHumanHairRootCount } from "./AutoMovieHumanHairRootCount";
import { AutoMovieHumanHairRootLattice } from "./AutoMovieHumanHairRootLattice";
import { AutoMovieHumanHairRootMirror } from "./AutoMovieHumanHairRootMirror";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The scalp hair's root directions: one stable root authority for a card
 * width, built on the canonical side and reflected.
 *
 * The size comes from the occlusion law (`AutoMovieHumanHairRootCount`), so
 * it depends on the style alone, never on the length; the points are the
 * Fibonacci lattice (`AutoMovieHumanHairRootLattice`); the canonical half and
 * its reflection are `AutoMovieHumanHairRootMirror`'s.
 */
export namespace AutoMovieHumanHairRoots {
  /** One root. */
  export interface IRoot {
    /** Stable index: twice the lattice index, plus one for a mirror. */
    index: number;

    /** Seed shared by a root and its mirror: the lattice index. */
    seed: number;

    /** Whether this root is the reflection of a canonical one. */
    mirror: boolean;

    /** Unit direction from the chart centre. */
    u: AutoMovieHumanSkinVector.Vec3;
  }

  /**
   * Every root for one card width.
   *
   * @param width Card width at the root, mm
   * @returns Roots, each canonical one followed by its mirror
   */
  export function lattice(width: number): IRoot[] {
    const count: number = AutoMovieHumanHairRootCount.count(width);
    return AutoMovieHumanHairRootMirror.reflect(
      AutoMovieHumanHairRootLattice.points(count),
      count,
    );
  }

  /**
   * A direction's azimuth magnitude over a turn, in [0, 0.5]: the noise of
   * every root-addressed law reads it, so a root and its mirror draw the
   * same value.
   *
   * @param u Unit direction in the head chart's frame
   * @returns Share of a turn from the front midline
   */
  export function turn(u: AutoMovieHumanSkinVector.Vec3): number {
    return Math.abs(Math.atan2(u[2], u[0])) / (2 * Math.PI);
  }
}
