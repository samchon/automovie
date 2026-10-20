import type { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";

/** Relaxed trunk and raised-arm shoulder dimensions. */
export interface IAutoMovieHumanTorsoSupplement {
  /** Uncompressed chest breadth used for the relaxed envelope, mm; it is distinct from a compressed caliper breadth. */
  relaxedChestBreadthMm: number;

  /** Standing height of the chest section, mm, above the standing-surface datum. */
  chestHeightMm: number;

  /** Standing height of the underfold section, mm; a section-design anchor rather than a guaranteed skin crease. */
  underfoldHeightMm: number;

  /** Fore-aft depth of the underfold section, mm. */
  underbustDepthMm: number;

  /** Fraction of chest depth anterior to the trunk axis; dimensionless. */
  chestAnteriorFraction: number;

  /** Fraction of waist depth anterior to the trunk axis; dimensionless. */
  waistAnteriorFraction: number;

  /** Transverse separation between the paired anterior chest peaks, mm. */
  chestPeakSeparationMm: number;

  /** Left and right anterior mass projection beyond the trunk core, mm. */
  pairedMassProjectionMm: IAutoMovieHumanPair<number>;

  /** Posterior median recess relative to the posterior trunk envelope, mm. */
  spinalGrooveDepthMm: number;

  /** Soft-tissue offset above the raised-arm shoulder support, mm. */
  deltoidSuperiorThicknessMm: number;

  /** Clavicular recess relative to the upper trunk envelope, mm. */
  clavicularHollowDepthMm: number;

  /** Posterior soft-tissue offset around the shoulder support, mm. */
  posteriorShoulderThicknessMm: number;

  /** Drop from the raised-arm support to the axillary floor, mm; a rest-conversion input, not a bone translation. */
  axillaryFloorDropMm: number;

  /** Left and right transverse breadth divided by depth at the upper-arm section; dimensionless. */
  upperArmBreadthDepthRatio: IAutoMovieHumanPair<number>;

  /** Left and right tape girths at the proximal upper-arm section, mm. */
  proximalUpperArmCircumferenceMm: IAutoMovieHumanPair<number>;
}
