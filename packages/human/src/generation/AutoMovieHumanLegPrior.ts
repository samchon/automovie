import type { IAutoMovieHumanLegPrior } from "@automovie/interface";

/** Independent baseline for the legacy leg section API. */
export namespace AutoMovieHumanLegPrior {
  /**
   * The ankle is the sagittal frame origin and the crotch follows inseam.
   * Nominal channels describe a centred circular section. The actual tapes
   * correct radii at their own knots, and the trunk supplies the last ring.
   * ESTIMATE: the old ankle-to-crotch chart has the knee at half its length,
   * calf at one third and thigh tape at five sixths. With no tape, the
   * uncorrected equivalent radius increases by a factor of two from ankle to
   * thigh. McIlroy and Maki's quiet stance (PMID 11415674) supplies 85 mm from
   * the midline to each heel centre as legacy neutral spacing.
   */
  export const PRIOR: IAutoMovieHumanLegPrior.IPrior = {
    crotch: { offset: 0, height: 0, inseam: 1, thigh: 0, sex: 0 },
    ring: { forward: 0, lateral: 0 },
    ankle: { offset: 0, fat: 0, muscularity: 0 },
    stations: [0, 1],
    profile: [Math.log(1 / 16), Math.log(1 / 8)],
    forward: [0, 0],
    lateral: { offset: [85, 85], leg: [0, 0], hip: [0, 0], sex: [0, 0] },
    shape: [[1], [1]],
    calf: { station: 1 / 3, ratio: 1 },
    knee: { station: 1 / 2, ratio: 1 },
    thigh: { station: 5 / 6, ratio: 1 },
  };
}
