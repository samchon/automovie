import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";

/**
 * The brow's body, about 60 percent of its length arching up onto the orbital
 * margin, centred on the brow's axis (Rajput 2021, conventional; Gray 1918):
 * the upper-border hairs point down and outward, the lower-border hairs up
 * and outward, crossing at the axis (about 28 degrees times the position
 * across the brow, a convention of this prototype). Its borders fade over a
 * noisy edge, so the brow is not a stencil.
 */
export namespace AutoMovieHumanEyebrowBody {
  /**
   * Hair direction from the brow axis toward the temple, degrees.
   *
   * @param v Across the brow, -1 at the lower border, +1 at the upper
   * @returns Degrees
   */
  export function degrees(v: number): number {
    return -28 * v;
  }

  /**
   * The noisy position across the brow where the border fade begins.
   *
   * @param seed The brow's seed
   * @param t Along the brow
   * @param v Across the brow
   * @returns Edge position in [0.62, 0.82]
   */
  export function edge(seed: number, t: number, v: number): number {
    return (
      0.72 +
      0.2 *
        (AutoMovieHumanAppearanceNoise.value2(
          seed + 3,
          t * 18,
          v > 0 ? 1 : 0,
          0,
        ) -
          0.5)
    );
  }

  /**
   * Density across the brow: full inside the edge, fading to its border.
   *
   * @param edge The noisy edge position
   * @param v Across the brow
   * @returns Factor in [0, 1]
   */
  export function border(edge: number, v: number): number {
    return 1 - AutoMovieHumanEyelid.smoothstep(edge, 1.02, Math.abs(v));
  }
}
