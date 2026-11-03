import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * The posterolateral sector: the skin between the lateral line (a quarter turn)
 * and the posterior line (a half turn), the lateral half of the posterior
 * compartment. In the upper arm it is the triceps' lateral head; at the elbow
 * the lateral epicondyle's back and the anconeus; in the forearm the extensor
 * mass (Gray 1918).
 *
 * It owns one number at each landmark station: the fullness of the sector's
 * curve beyond the quintic Hermite of its two bounding lines
 * (`AutoMovieHumanPolarSector`), in units of the section's girth over 2 pi; the
 * values are the medians of the four references (see
 * `AutoMovieHumanAnterolateralSector`).
 */
export namespace AutoMovieHumanPosterolateralSector {
  /** The sector's fullness, fitted: medians of the four references. */
  const VALUES: Readonly<Record<AutoMovieHumanArmStation, number>> = {
    "u0.3": 0.001,
    "u0.45": -0.001,
    "u0.6": 0.001,
    "u0.75": -0.002,
    ridge: -0.003,
    elbow: -0.0066,
    "f0.1": -0.0249,
    "f0.22": -0.0027,
    "f0.4": 0.0236,
    "f0.6": 0.0102,
    "f0.8": 0.0078,
    "f0.95": 0.0107,
  };

  /**
   * The sector's fullness at a station.
   *
   * @param station The landmark station.
   */
  export function at(station: AutoMovieHumanArmStation): number {
    return VALUES[station];
  }
}
