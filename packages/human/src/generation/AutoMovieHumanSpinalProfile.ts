import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";

/**
 * The spinal furrow's profile: the cross curve alone (its depth against the
 * distance from the midline) times an along-the-furrow plateau, so the depth
 * is flat over the lumbar and thoracic run and falls to nothing at the
 * furrow's two ends, with a C2 edge all round.
 */
export namespace AutoMovieHumanSpinalProfile {
  /**
   * Depth of the furrow, mm. Conventional, flagged: to be read on the
   * references' back loops; the former trunk's back groove pull was 3 to 10 %
   * of the back's depth.
   */
  export const DEPTH: number = 3;

  /** Half width across the midline, mm. Conventional, flagged: the former trunk's back groove half width was 15 to 25 mm. */
  export const RADIUS: number = 22;

  /**
   * How much the bump along the furrow is raised before it is capped at 1,
   * which makes the middle three fifths of the furrow a plateau. Conventional.
   */
  export const PLATEAU: number = 1.6;

  /**
   * The profile's height at a place of the furrow's plane.
   *
   * @param u Distance from the midline, mm.
   * @param v Distance from the furrow's middle along it, mm.
   * @param half Half length of the furrow, mm.
   * @returns The height over the wall, mm; negative (a furrow).
   */
  export function height(u: number, v: number, half: number): number {
    const across: number = AutoMovieHumanTrunkFeatureProfile.bump(Math.abs(u) / RADIUS);
    const along: number = Math.min(1, PLATEAU * AutoMovieHumanTrunkFeatureProfile.bump(Math.abs(v) / half));

    return -DEPTH * across * along;
  }
}
