import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * The posterior line: the guide at the section's back angle (a half turn), the
 * longitudinal line that runs on the triceps in the upper arm, the olecranon at
 * the elbow, the subcutaneous ulnar border in the forearm (a nearly flat
 * stretch, its curvature near zero) and the ulnar styloid at the wrist
 * (Gray 1918).
 *
 * It owns the radius and its first and second angle derivative at every
 * landmark station, in units of the section's girth over 2 pi; the values are
 * the medians of the four references (see `AutoMovieHumanAnteriorLine`).
 */
export namespace AutoMovieHumanPosteriorLine {
  /** Radius, first and second angle derivative at a station. */
  export type Value = readonly [number, number, number];

  /** The line's values, fitted: medians of the four references. */
  const VALUES: Readonly<Record<AutoMovieHumanArmStation, Value>> = {
    "u0.3": [0.973, 0.123, 0.256],
    "u0.45": [1.023, 0.158, 0.14],
    "u0.6": [1.017, 0.105, 0.163],
    "u0.75": [1.004, 0.08, 0.006],
    ridge: [0.931, 0.109, 0],
    elbow: [0.8523, 0.1979, -0.2294],
    "f0.1": [0.9255, -0.0774, -0.0718],
    "f0.22": [0.9225, -0.0618, 0.3541],
    "f0.4": [0.9707, 0.0768, 0.2827],
    "f0.6": [1.0069, 0.1276, 0.1524],
    "f0.8": [0.876, 0.1077, 0.2382],
    "f0.95": [0.7047, -0.0432, 0.4631],
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
