import type { IAutoMovieHumanSeamKnot } from "../../lofting/IAutoMovieHumanSeamKnot";

/** Type contracts exchanged by AutoMovieHumanDigitSector; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanDigitSector {
  /** A guide's jet at a section's phase, in the section's `[across, palmar]` plane.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A guide's jet at a section's phase, in the section's `[across, palmar]` plane.
   * @evidence contracts/development/design.md#principled-representation `point`: Point, mm. `tangent`: Unit tangent in the direction of increasing phase. `curvature`: Curvature vector `kappa N`, toward the section's inside, 1/mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitSector.of. Also types AutoMovieHumanDigitRing.guides.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `tangent`, `curvature`, `speed`; callers supply the complete record.
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

  /** Result of AutoMovieHumanDigitSector.of. The sector's jet at a phase.
  @param from The guide at the sector's start.
  @param to The guide at its end.
  @param span Phase between the two guides, radians.
  @param start Absolute phase of the start guide.
  @returns A function of absolute phase giving `[p, p', p'']` per radian.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The sector's jet at a phase.
 * @evidence contracts/development/design.md#principled-representation The sector's jet at a phase. The callable takes t and returns IAutoMovieHumanSeamKnot.Jet.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitSector.OfResult is the canonical exchange used by AutoMovieHumanDigitSector.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitSector.of for the sector's jet at a phase.
 */
  export type OfResult = (t: number) => IAutoMovieHumanSeamKnot.Jet;
}
