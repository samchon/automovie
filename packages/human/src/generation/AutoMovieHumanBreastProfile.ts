/**
 * The breast's side profile alone: its height over the chest wall against the
 * normalised distance from the bust point, the curve that sweeps over the
 * footprint into the dome.
 *
 * The height is the bust point's projection at the centre times the trunk
 * features' bump (`AutoMovieHumanTrunkFeatureProfile.bump`, swept by
 * `AutoMovieHumanBreastDome`), with a rounded apex, falling by `(1 - rho^2)^3` to the rim with slope and curvature zero
 * there, so the breast leaves the wall tangent to it. Its projection is what
 * closes the chest tape over the chest wall, which continues the rib cage the
 * underbust tape measures at the fold (`AutoMovieHumanTrunkClosure.tapes`):
 * the tape's excess over the wall lies on the two domes, not round the whole
 * torso.
 */
export namespace AutoMovieHumanBreastProfile {
  /**
   * The first reading of the projection's solve from the tapes: their excess
   * shared by the two domes, each lifting the tape over its own front, so
   * `(chest - underbust) / pi`.
   *
   * @param chest The chest tape at the bust point, mm.
   * @param underbust The underbust tape at the fold, mm.
   * @returns The projection, mm; 0 when the chest is not larger than the underbust.
   */
  export function start(chest: number, underbust: number): number {
    return Math.max(0, chest - underbust) / Math.PI;
  }

}
