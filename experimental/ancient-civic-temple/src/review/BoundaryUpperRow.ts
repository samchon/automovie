/** Evaluate every compiled wall boundary against the upper exterior-band rule. */

export interface BoundaryUpperRow {
  /** Boundary identity. */
  id: string;
  /** Stations placed along the boundary face. */
  sampled: number;
  /** Stations where both adjacent spaces have a cap. */
  tested: number;
  /** Tested stations whose host rises more than 0.02 m into the other side's volume. */
  exposed: number;
  /** Largest exposed band height in metres. */
  maxBand: number;
  /**
   * Station of the largest band: its position along the face, the host top and both spaces' caps;
   * null when nothing is exposed.
   */
  maxAt: { u: number; hostTop: number; firstCap: number; secondCap: number } | null;
}

