import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The foot's dorsum and medial arch heights, standing: the side view's knots
 * of the foot's top and medial profiles at their published sites.
 *
 * Source: Williams D.S. and McClay I.S., "Measurements used to characterize
 * the foot and the medial longitudinal arch: reliability and validity", Phys
 * Ther 80(9):864-871 (2000), Table 2, 102 feet at 90 % weight bearing
 * (`docs/sources/williams-mcclay-2000-arch-height.md`): the dorsum height, the
 * floor to the foot's top at half the foot's length, is 0.292 (SD 0.027) of
 * the truncated foot length (the heel to the first metatarsophalangeal joint,
 * the arch height index); the navicular height, the floor to the navicular's
 * most anterior-inferior point, is 0.142 (SD 0.026) of the foot length.
 * Butler et al.'s 100 runners give the index 0.340 (0.030), the population's
 * spread between the two samples.
 *
 * Derivation: the truncated length is the person's ball-of-foot length (ANSUR
 * II, the heel to the first metatarsal head), and the foot length the
 * person's; the dorsum's knot stands at half the foot length, the arch's at
 * the navicular, whose place along the foot is not in these sources.
 *
 * Limits: one clinical sample of mixed sex; the ratios are its means, so every
 * person's arch takes the same shape scaled by the foot.
 */
export namespace AutoMovieHumanFootArch {
  /** Dorsum height over truncated foot length, standing (arch height index), Williams and McClay 2000. */
  export const ARCH_HEIGHT_INDEX: number = 0.292;

  /** Navicular height over foot length, standing, Williams and McClay 2000. */
  export const NAVICULAR_OVER_FOOT_LENGTH: number = 0.142;

  /**
   * The dorsum's height at half the foot's length, standing.
   *
   * @param measures A person's resolved measures, for the ball-of-foot length.
   * @returns Height above the floor, mm.
   */
  export function dorsum(measures: IAutoMovieHumanBodyMeasures): number {
    return ARCH_HEIGHT_INDEX * measures.ballOfFootLength;
  }

  /**
   * The navicular's height, the medial arch's knot, standing.
   *
   * @param footLength The foot's length, mm.
   * @returns Height above the floor, mm.
   */
  export function navicular(footLength: number): number {
    return NAVICULAR_OVER_FOOT_LENGTH * footLength;
  }
}
