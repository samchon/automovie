import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * The medial line: the guide at the section's medial angle (three quarters of a
 * turn), the longitudinal line that runs on the medial intermuscular septum and
 * the neurovascular groove in the upper arm, the medial epicondyle (the more
 * prominent) at the elbow, the flexor mass in the forearm and the palmar side of
 * the wrist (Gray 1918).
 *
 * It owns the radius and its first and second angle derivative at every
 * landmark station, in units of the section's girth over 2 pi; the values are
 * the medians of the four references (see `AutoMovieHumanAnteriorLine`).
 */
export namespace AutoMovieHumanMedialLine {
  /** Radius, first and second angle derivative at a station. */
  export type Value = readonly [number, number, number];

  /** The line's values, fitted: medians of the four references. */
  const VALUES: Readonly<Record<AutoMovieHumanArmStation, Value>> = {
    "u0.3": [0.909, -0.138, 0.335],
    "u0.45": [1.012, -0.269, -0.034],
    "u0.6": [1.01, -0.28, 0.042],
    "u0.75": [0.976, -0.177, 0.309],
    ridge: [0.976, -0.022, 0.19],
    elbow: [0.9607, 0.1071, 0.1013],
    "f0.1": [0.9856, -0.0208, -0.1254],
    "f0.22": [0.9819, -0.1465, -0.1922],
    "f0.4": [0.985, -0.2021, -0.0831],
    "f0.6": [0.9712, -0.1795, -0.0511],
    "f0.8": [0.8923, -0.047, 0.0937],
    "f0.95": [0.7396, 0.1188, 0.388],
  };

  /**
   * The line's values at a station.
   *
   * @param station The landmark station.
   */
  export function at(station: AutoMovieHumanArmStation): Value {
    return VALUES[station];
  }
}
