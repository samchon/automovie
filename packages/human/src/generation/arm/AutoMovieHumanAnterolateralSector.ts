import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * The anterolateral sector: the skin between the anterior line (angle 0) and
 * the lateral line (a quarter turn), the lateral half of the anterior
 * compartment. In the upper arm it is the biceps' lateral head and the
 * brachialis; at the elbow the mobile wad's origin; in the forearm the
 * brachioradialis and the radial extensors (Gray 1918).
 *
 * It owns one number at each landmark station: the fullness of the sector's
 * curve beyond the quintic Hermite of its two bounding lines
 * (`AutoMovieHumanPolarSector`), in units of the section's girth over 2 pi. The
 * values are the medians of the four references f1, f2, m1 and m2, read on each
 * skin square to its own bone: fitted, not derived.
 */
export namespace AutoMovieHumanAnterolateralSector {
  /** The sector's fullness, fitted: medians of the four references. */
  const VALUES: Readonly<Record<AutoMovieHumanArmStation, number>> = {
    "u0.3": 0.005,
    "u0.45": -0.016,
    "u0.6": -0.008,
    "u0.75": 0.006,
    ridge: 0.065,
    elbow: 0.0546,
    "f0.1": 0.0352,
    "f0.22": 0.0086,
    "f0.4": -0.0091,
    "f0.6": 0.001,
    "f0.8": 0.0031,
    "f0.95": -0.051,
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
