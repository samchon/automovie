/** Transverse sections and vertical mass positions of one leg.
 */
export interface IAutoMovieHumanLegSupplement {
  /** Thigh transverse breadth divided by fore-aft depth; dimensionless. */
  thighBreadthOverDepth: number;

  /** Calf transverse breadth divided by fore-aft depth; dimensionless. */
  calfBreadthOverDepth: number;

  /** Transverse breadth of the ankle section, mm. */
  ankleBreadthMm: number;

  /** Vertical extent of the anterior patellar mass, mm. */
  patellaHeightMm: number;

  /** Tape girth at the knee support section, mm. */
  kneeCircumferenceMm: number;

  /** Tape girth of the proximal calf section below the knee, mm. */
  belowKneeCircumferenceMm: number;

  /** Height of the maximum calf section above the actual ankle joint, mm. */
  calfMaximumHeightAboveAnkleMm: number;

  /** Height of the minimum ankle section above its actual joint, mm. */
  ankleMinimumHeightAboveJointMm: number;

  /** Anterior partition of the maximum calf depth relative to the leg axis, mm. */
  calfAnteriorReachMm: number;

  /** Anterior partition of the ankle depth relative to its axis, mm. */
  ankleAnteriorReachMm: number;
}
