import type { IAutoMovieHumanBreastFootprint } from "@automovie/interface";

import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";

/**
 * The breast's footprint on the chest wall, in the breast's frame about the
 * bust point: two half ellipses sharing a lateral half width, the lower
 * reaching the inframammary fold and the upper `UPPER` times as far.
 *
 * The fold is the lower edge, where the underbust tape is taken, so the
 * footprint's lower reach is the bust point's height over the fold. The upper
 * pole reaches further than the lower pole (the breast's mass stands above
 * its nipple more than below it, Gray 1918), which makes the lower pole the
 * steeper. Laterally the footprint stands inside the sternal guide's line, so
 * the sternum between the breasts keeps the wall's own convex section.
 */
export namespace AutoMovieHumanBreastFootprint {
  /** Upper reach over lower reach. ESTIMATE to spread the superior transition farther along the chest than the lower fold. */
  export const UPPER: number = 1.6;

  /** Lateral half width over the bust point's place off the midline. Conventional, flagged. */
  export const REACH: number = 0.8;

  /**
   * The footprint.
   *
   * @param lateral The bust point's place off the midline, mm: half the bust span (ISO 8559-1 5.2.3).
   * @param lower The bust point's height over the inframammary fold, mm.
   * @returns The footprint.
   */
  export function create(
    lateral: number,
    lower: number,
  ): IAutoMovieHumanBreastFootprint.IFootprint {
    const half: number = REACH * lateral;
    const l: number = Math.max(1, lower);
    const upper: number = UPPER * l;

    return {
      half,
      lower: l,
      upper,
      rho: (u: number, v: number): number =>
        AutoMovieHumanTrunkFeatureProfile.rho(u, v, half, l, upper),
    };
  }
}
