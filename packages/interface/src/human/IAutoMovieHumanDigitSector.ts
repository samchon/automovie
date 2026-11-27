import type { IAutoMovieHumanSeamKnot } from "./IAutoMovieHumanSeamKnot";

/**
 * Section guide jets and the resulting absolute-phase evaluator, with radian
 * derivatives. Runtime construction and admission remain with
 * AutoMovieHumanDigitSector in Human.
 */
export namespace IAutoMovieHumanDigitSector {
  /**
   * A guide's jet at a section's phase, in the section's `[across, palmar]`
   * plane.
   */
  export interface IGuide {
    /** Point, mm. */
    point: [number, number];

    /** Unit tangent in the direction of increasing phase. */
    tangent: [number, number];

    /** Curvature vector `kappa N`, toward the section's inside, 1/mm. */
    curvature: [number, number];

    /** Parameter speed, mm per radian of phase. */
    speed: number;
  }

  /**
   * Evaluate a section-sector jet at absolute phase t in radians. The result
   * carries position and first/second phase derivatives in the section's
   * [across, palmar] chart.
   */
  export type OfResult = (t: number) => IAutoMovieHumanSeamKnot.Jet;
}
