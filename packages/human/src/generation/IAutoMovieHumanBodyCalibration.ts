import type { IAutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";

/**
 * Shared shape coefficients (theta) of the generated body surface.
 *
 * The chains are principal layers fitted from saved Recovery/Hermite
 * sections of a calibration specimen in the registered frame: forward +X,
 * up +Y, lateral +Z, millimetres, floor at y = 0. The generator reads this
 * object and the public parameters only; it never reads reference files.
 *
 * Calibration is one stage of the campaign plan: the coefficients first
 * reproduce one specimen, then are replaced by laws in the public inputs
 * identified across all references. Until then a person's shape differs
 * from the calibration only through the inputs the generator applies.
 */
export interface IAutoMovieHumanBodyCalibration {
  /** Achieved stature input of the calibration specimen in mm. */
  stature: number;

  /**
   * Body chains by name: `upper` (axillae to crown), `trunk` (crotch to
   * axillae), `arm.left`, `arm.right`, `leg.left` and `leg.right`.
   */
  chains: IAutoMovieHumanLoftChain[];

  /**
   * Crotch contact: the trunk's lowest ring is split into the two leg rings
   * at trunk phases 0 (front) and pi (back), where both thighs touch.
   */
  crotch: {
    /** Height of the contact in mm; trunk bottom and leg tops. */
    y: number;
  };

  /**
   * Axillary contacts: the upper chain's lowest ring is split into the
   * trunk and two arm rings at four pinch phases where the arm lobes touch
   * the chest wall.
   */
  axilla: {
    /** Height of the contacts in mm; upper bottom, trunk and arm tops. */
    y: number;

    /** Upper-chain phases `[front, back]` of the left (+Z) arm lobe. */
    left: [number, number];

    /** Upper-chain phases `[back, front]` of the right (-Z) arm lobe, increasing. */
    right: [number, number];
  };
}
