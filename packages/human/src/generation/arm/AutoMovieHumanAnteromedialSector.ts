import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * The anteromedial sector: the skin between the medial line (three quarters of
 * a turn) and the anterior line (a full turn), the medial half of the anterior
 * compartment. In the upper arm it is the biceps' medial belly and the
 * neurovascular bundle's furrow; at the elbow the cubital fossa's medial wall;
 * in the forearm the pronator-flexor mass (Gray 1918).
 *
 * It owns one number at each landmark station: the fullness of the sector's
 * curve beyond the quintic Hermite of its two bounding lines
 * (`AutoMovieHumanPolarSector`), in units of the section's girth over 2 pi; the
 * values are the medians of the four references (see
 * `AutoMovieHumanAnterolateralSector`).
 */
export namespace AutoMovieHumanAnteromedialSector {
  /** The sector's fullness, fitted: medians of the four references. */
  const VALUES: Readonly<Record<AutoMovieHumanArmStation, number>> = {
    "u0.3": -0.023,
    "u0.45": -0.015,
    "u0.6": 0.002,
    "u0.75": 0.004,
    ridge: 0.01,
    elbow: 0.0106,
    "f0.1": 0.0094,
    "f0.22": 0.0028,
    "f0.4": 0.0005,
    "f0.6": -0.009,
    "f0.8": 0.0001,
    "f0.95": 0.0344,
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
