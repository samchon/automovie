import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";

/**
 * The breast's side profile alone: its height over the chest wall against the
 * normalised distance from the bust point, the curve that sweeps over the
 * footprint into the dome.
 *
 * The height is the bust point's projection at the centre, with a rounded
 * apex, falling by `(1 - rho^2)^3` to the rim with slope and curvature zero
 * there, so the breast leaves the wall tangent to it. Its projection is the
 * tapes' excess as a radius: the chest tape over the underbust tape, over 2
 * pi, which is the cup excess bra sizing reads (the definition; the former
 * trunk's rise of 1 without its sex term).
 */
export namespace AutoMovieHumanBreastProfile {
  /**
   * The breast's projection from its tapes.
   *
   * @param chest The chest tape at the bust point, mm.
   * @param underbust The underbust tape at the fold, mm.
   * @returns The projection, mm; 0 when the chest is not larger than the underbust.
   */
  export function projection(chest: number, underbust: number): number {
    return Math.max(0, chest - underbust) / (2 * Math.PI);
  }

  /**
   * The profile's height at a normalised radius.
   *
   * @param rho Normalised distance from the bust point, 1 at the rim.
   * @param projection The bust point's projection, mm.
   * @returns The height over the wall, mm.
   */
  export function height(rho: number, projection: number): number {
    return projection * AutoMovieHumanTrunkFeatureProfile.bump(rho);
  }
}
