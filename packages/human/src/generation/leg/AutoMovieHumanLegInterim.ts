import { AutoMovieHumanLegGirth } from "./AutoMovieHumanLegGirth";

/**
 * The leg's interim accessors (#3044's rule for priors the campaign has not
 * yet replaced; `log-body.md`, "Interim accessors"), read on today's leg
 * laws and swapped for the leg's own when they land.
 */
export namespace AutoMovieHumanLegInterim {
  /**
   * Interim accessor: the ankle's least girth's height, the old shank law's
   * least row (`AutoMovieHumanLegGirth.SHANK`). Owed law: the least-girth
   * site.
   *
   * @param knee The knee centre's height, calibration mm.
   * @param ankle The ankle centre's height, calibration mm.
   * @returns The site's height, calibration mm.
   */
  export function ankleSite(knee: number, ankle: number): number {
    let least: readonly [number, number] = AutoMovieHumanLegGirth.SHANK[0]!;
    for (const row of AutoMovieHumanLegGirth.SHANK) if (row[1] < least[1]) least = row;
    return knee - least[0] * (knee - ankle);
  }
}
