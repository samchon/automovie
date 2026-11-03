import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * The lateral line: the guide at the section's lateral angle (a quarter turn),
 * the longitudinal line that runs on the lateral intermuscular septum in the
 * upper arm, the lateral epicondyle (with the radial head's dimple below it) at
 * the elbow, the extensor mass in the forearm and the dorsal side of the wrist
 * (Gray 1918).
 *
 * It owns the radius and its first and second angle derivative at every
 * landmark station, in units of the section's girth over 2 pi; the values are
 * the medians of the four references (see `AutoMovieHumanAnteriorLine`).
 */
export namespace AutoMovieHumanLateralLine {
  /** Radius, first and second angle derivative at a station. */
  export type Value = readonly [number, number, number];

  /** The line's values, fitted: medians of the four references. */
  const VALUES: Readonly<Record<AutoMovieHumanArmStation, Value>> = {
    "u0.3": [1.084, -0.099, -0.235],
    "u0.45": [0.974, 0.004, -0.08],
    "u0.6": [0.932, 0.032, 0.081],
    "u0.75": [0.957, -0.06, 0.082],
    ridge: [1.041, -0.303, 0.027],
    elbow: [1.0148, -0.4752, 0.0526],
    "f0.1": [1.075, -0.4169, -0.3226],
    "f0.22": [1.1021, -0.3016, -0.236],
    "f0.4": [1.0836, -0.1261, -0.2239],
    "f0.6": [1.0554, -0.0231, 0.0356],
    "f0.8": [1.0027, -0.1398, 0.287],
    "f0.95": [0.9419, -0.1733, 0.4274],
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
