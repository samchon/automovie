import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * The anterior line: the guide at the section's forward angle (0), the
 * longitudinal line that runs on the biceps crest in the upper arm, through the
 * cubital fossa at the elbow, on the radial border (the brachioradialis ridge)
 * in the forearm and to the radial styloid at the wrist (Gray 1918).
 *
 * It owns the radius of the section there and its first and second derivative
 * in the section angle, each in units of the section's girth over 2 pi, at every
 * landmark station. Values are the medians of the four references f1, f2, m1 and
 * m2, read on each skin square to its own bone (the centroid line of its
 * sections), the derivatives by least squares over +-12 degrees about the
 * angle; they are fitted, not derived. The line is the sector rule's guide
 * (`AutoMovieHumanPolarSector`): the sectors on either side meet it with its
 * own point, tangent and curvature.
 */
export namespace AutoMovieHumanAnteriorLine {
  /** Radius, first and second angle derivative at a station. */
  export type Value = readonly [number, number, number];

  /** The line's values, fitted: medians of the four references. */
  const VALUES: Readonly<Record<AutoMovieHumanArmStation, Value>> = {
    "u0.3": [0.99, 0.087, -0.145],
    "u0.45": [0.984, 0.005, -0.241],
    "u0.6": [1.02, -0.013, -0.342],
    "u0.75": [1.017, -0.008, -0.133],
    ridge: [0.882, 0.083, 1.299],
    elbow: [0.9667, 0.1506, 1.5185],
    "f0.1": [0.8556, 0.2211, 1.2569],
    "f0.22": [0.8805, 0.2665, 0.6572],
    "f0.4": [0.9073, 0.2269, 0.1805],
    "f0.6": [0.9202, 0.2123, 0.1724],
    "f0.8": [1.1352, 0.3345, -0.0628],
    "f0.95": [1.439, 0.524, -1.5011],
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
