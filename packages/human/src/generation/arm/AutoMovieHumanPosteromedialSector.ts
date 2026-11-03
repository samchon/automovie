import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * The posteromedial sector: the skin between the posterior line (a half turn)
 * and the medial line (three quarters of a turn), the medial half of the
 * posterior compartment. In the upper arm it is the triceps' medial head and
 * the ulnar nerve's course; at the elbow the olecranon's medial slope and the
 * ulnar groove (concave); in the forearm the flexor carpi ulnaris over the
 * ulnar border (Gray 1918).
 *
 * It owns one number at each landmark station: the fullness of the sector's
 * curve beyond the quintic Hermite of its two bounding lines
 * (`AutoMovieHumanPolarSector`), in units of the section's girth over 2 pi; the
 * values are the medians of the four references (see
 * `AutoMovieHumanAnterolateralSector`).
 */
export namespace AutoMovieHumanPosteromedialSector {
  /** The sector's fullness, fitted: medians of the four references. */
  const VALUES: Readonly<Record<AutoMovieHumanArmStation, number>> = {
    "u0.3": 0.009,
    "u0.45": 0.01,
    "u0.6": 0.007,
    "u0.75": 0.006,
    ridge: 0.006,
    elbow: -0.0421,
    "f0.1": 0.0125,
    "f0.22": 0.01,
    "f0.4": 0.0052,
    "f0.6": 0.0023,
    "f0.8": 0.008,
    "f0.95": 0.0199,
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
