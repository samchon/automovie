import type { IAutoMovieHumanToeSetSupplement } from "./IAutoMovieHumanToeSetSupplement";

/** Unloaded support dimensions referenced to the foot plantar datum.
 */
export interface IAutoMovieHumanFootSupplement {
  /** Transverse heel support breadth, mm. */
  heelBreadthMm: number;

  /** Posterior heel reach from the ankle chart, mm. */
  heelBehindAnkleMm: number;

  /** Unloaded heel-pad height above the plantar datum, mm. */
  heelPadHeightMm: number;

  /** Metatarsal ball height above the plantar datum, mm. */
  ballHeightMm: number;

  /** Dorsal instep height above the plantar datum, mm. */
  instepHeightMm: number;

  /** Medial plantar arch clearance above the plantar datum, mm. */
  plantarArchHeightMm: number;

  /** Toe-pad thickness above the plantar datum, mm. */
  toePadHeightMm: number;

  /** Separation used to construct the interdigital web, mm. */
  webGapMm: number;

  /** Independent dimensions of all five digits; no missing toe measurement is borrowed from a source catalogue. */
  toeSet: IAutoMovieHumanToeSetSupplement;
}
