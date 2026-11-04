/**
 * One horizontal section of the trunk's column, canonical left half: the
 * measures the guides and sectors read, at one height, in calibration
 * millimetres in the body frame (forward +X, up +Y, left +Z).
 *
 * The front and the back quadrant each lie on `zeta^n + xi^n = 1` in
 * normalised coordinates `zeta = z / width` and `xi = (x - middle) / depth`,
 * with the section's squareness `n` per quadrant.
 */
export interface IAutoMovieHumanTrunkSection {
  /** Height, mm. */
  y: number;

  /** Half width at the widest point. */
  width: number;

  /** Forward place of the widest point. */
  middle: number;

  /** Forward place of the front midline. */
  front: number;

  /** Forward place of the back midline. */
  back: number;

  /** Squareness of the front quadrant. */
  squareFront: number;

  /** Squareness of the back quadrant. */
  squareBack: number;

  /** Lateral share of the half width where the anterior axillary guide stands. */
  anterior: number;

  /** Lateral share where the posterior axillary guide stands; absent, the guide's own constant. */
  posterior?: number;

  /**
   * The front quadrant's displacement toward the back at a lateral place
   * (the inguinal fold), mm: the value and its first and second derivatives
   * in z.
   */
  foldFront: (z: number) => [number, number, number];

  /**
   * The back quadrant's displacement toward the front at a lateral place
   * (the gluteal cleft), mm, with its first and second derivatives in z.
   */
  foldBack: (z: number) => [number, number, number];
}
