import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";
import type { AutoMovieHumanNailPlate } from "./AutoMovieHumanNailPlate";

const { bump }: typeof AutoMovieHumanHandWindow = AutoMovieHumanHandWindow;

/**
 * The nail folds: the horseshoe of skin that begins behind the nail's root
 * and runs along both sides of the plate, bevelling below its free end
 * (Bridgman 1920, `docs/anatomy/hand.md`, Form), written as a relief window
 * over the dorsal skin in the plate's own frame.
 *
 * The fold stands proud of the skin in a band of width {@link BAND} mm
 * around the plate's outline: behind the root and beside the edges, open at
 * the free edge. In the plate's chart `(u, v)` (root 0 to free edge 1,
 * radial edge -1 to ulnar 1) the distance from the plate's outline, in
 * millimetres, is
 *
 * ```text
 * d(u, v) = hypot(L max(0, -u), (W / 2) max(0, |v| - 1))
 * ```
 *
 * and the height is `HEIGHT_SHARE * W * bump((d - BAND / 2) / (BAND / 2))`
 * for `0 < d < BAND`: zero at the plate's edge and at the band's outer edge
 * with its slope and curvature, so the fold meets the plate under it (G0 with
 * the plate's edge going under the fold, a declared step) and the dorsal skin
 * around it (G1 and in fact C2) without a crease. The window ends at the free
 * edge: where `u > 1` the sides' distance stays the same and the fold fades
 * by `bump` of `u - 1` over {@link BAND}.
 *
 * Dimensions are CONVENTIONS with the plate's (no nail source is read).
 */
export namespace AutoMovieHumanNailFold {
  /** Band width around the plate, mm: a convention. */
  export const BAND: number = 2.5;

  /** Height over the plate's width: a convention. */
  export const HEIGHT_SHARE: number = 0.04;

  /**
   * The fold's height over the dorsal skin at a plate chart point, mm.
   *
   * @param size The plate's dimensions.
   * @param u Along the plate, 0 at the root and 1 at the free edge; the fold continues past 1 and fades.
   * @param v Across the plate, -1 to 1 over the plate itself.
   */
  export function height(size: AutoMovieHumanNailPlate.ISize, u: number, v: number): number {
    const behind: number = size.length * Math.max(0, -u);
    const beside: number = (size.width / 2) * Math.max(0, Math.abs(v) - 1);
    const d: number = Math.hypot(behind, beside);
    if (d <= 0 || d >= BAND) return 0;

    // Past the free edge the sides' fold fades out along the line.
    const fade: number = u <= 1 ? 1 : bump(((u - 1) * size.length) / BAND).value;
    return HEIGHT_SHARE * size.width * bump((d - BAND / 2) / (BAND / 2)).value * fade;
  }
}
