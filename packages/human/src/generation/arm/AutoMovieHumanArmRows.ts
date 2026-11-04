import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import type { AutoMovieHumanArmStation } from "./AutoMovieHumanArmStation";

/**
 * A span's shape row at a landmark station, from one table of the columns
 * that own its numbers, in the order {@link IAutoMovieHumanArmPiece.IRow}
 * states: the four guide lines (anterior, lateral, posterior, medial), each
 * the radius of the section there and its first and second derivative in the
 * section angle, and the four sectors between them (anterolateral,
 * posterolateral, posteromedial, anteromedial), each the fullness of the
 * sector's curve beyond the quintic Hermite of its two bounding lines
 * (`AutoMovieHumanPolarSector`), all in units of the section's girth over
 * 2 pi. A line is the sector rule's guide: the sectors on either side meet it
 * with its own point, tangent and curvature. Values are the medians of the
 * four references f1, f2, m1 and m2, read on each skin square to its own bone
 * (the centroid line of its sections), the derivatives by least squares over
 * +-12 degrees about the angle; they are fitted, not derived. The columns
 * (Gray 1918):
 *
 * - the anterior line: the guide at the section's forward angle (0), the longitudinal line that runs on the biceps crest in the upper arm, through the cubital fossa at the elbow, on the radial border (the brachioradialis ridge) in the forearm and to the radial styloid at the wrist (Gray 1918).
 * - the lateral line: the guide at the section's lateral angle (a quarter turn), the longitudinal line that runs on the lateral intermuscular septum in the upper arm, the lateral epicondyle (with the radial head's dimple below it) at the elbow, the extensor mass in the forearm and the dorsal side of the wrist (Gray 1918).
 * - the posterior line: the guide at the section's back angle (a half turn), the longitudinal line that runs on the triceps in the upper arm, the olecranon at the elbow, the subcutaneous ulnar border in the forearm (a nearly flat stretch, its curvature near zero) and the ulnar styloid at the wrist (Gray 1918).
 * - the medial line: the guide at the section's medial angle (three quarters of a turn), the longitudinal line that runs on the medial intermuscular septum and the neurovascular groove in the upper arm, the medial epicondyle (the more prominent) at the elbow, the flexor mass in the forearm and the palmar side of the wrist (Gray 1918).
 * - the anterolateral sector: the skin between the anterior line (angle 0) and the lateral line (a quarter turn), the lateral half of the anterior compartment. In the upper arm it is the biceps' lateral head and the brachialis; at the elbow the mobile wad's origin; in the forearm the brachioradialis and the radial extensors (Gray 1918).
 * - the posterolateral sector: the skin between the lateral line (a quarter turn) and the posterior line (a half turn), the lateral half of the posterior compartment. In the upper arm it is the triceps' lateral head; at the elbow the lateral epicondyle's back and the anconeus; in the forearm the extensor mass (Gray 1918).
 * - the posteromedial sector: the skin between the posterior line (a half turn) and the medial line (three quarters of a turn), the medial half of the posterior compartment. In the upper arm it is the triceps' medial head and the ulnar nerve's course; at the elbow the olecranon's medial slope and the ulnar groove (concave); in the forearm the flexor carpi ulnaris over the ulnar border (Gray 1918).
 * - the anteromedial sector: the skin between the medial line (three quarters of a turn) and the anterior line (a full turn), the medial half of the anterior compartment. In the upper arm it is the biceps' medial belly and the neurovascular bundle's furrow; at the elbow the cubital fossa's medial wall; in the forearm the pronator-flexor mass (Gray 1918).
 *
 * A span owns where its rows stand (the walk length of every landmark); this
 * table owns what the rows say.
 */
export namespace AutoMovieHumanArmRows {
  /** The channels at each landmark station: the four lines' three numbers each, then the four sectors' one. */
  const ROWS: Readonly<Record<AutoMovieHumanArmStation, readonly number[]>> = {
    "u0.3": [0.99, 0.087, -0.145, 1.084, -0.099, -0.235, 0.973, 0.123, 0.256, 0.909, -0.138, 0.335, 0.005, 0.001, 0.009, -0.023],
    "u0.45": [0.984, 0.005, -0.241, 0.974, 0.004, -0.08, 1.023, 0.158, 0.14, 1.012, -0.269, -0.034, -0.016, -0.001, 0.01, -0.015],
    "u0.6": [1.02, -0.013, -0.342, 0.932, 0.032, 0.081, 1.017, 0.105, 0.163, 1.01, -0.28, 0.042, -0.008, 0.001, 0.007, 0.002],
    "u0.75": [1.017, -0.008, -0.133, 0.957, -0.06, 0.082, 1.004, 0.08, 0.006, 0.976, -0.177, 0.309, 0.006, -0.002, 0.006, 0.004],
    ridge: [0.882, 0.083, 1.299, 1.041, -0.303, 0.027, 0.931, 0.109, 0, 0.976, -0.022, 0.19, 0.065, -0.003, 0.006, 0.01],
    elbow: [0.9667, 0.1506, 1.5185, 1.0148, -0.4752, 0.0526, 0.8523, 0.1979, -0.2294, 0.9607, 0.1071, 0.1013, 0.0546, -0.0066, -0.0421, 0.0106],
    "f0.1": [0.8556, 0.2211, 1.2569, 1.075, -0.4169, -0.3226, 0.9255, -0.0774, -0.0718, 0.9856, -0.0208, -0.1254, 0.0352, -0.0249, 0.0125, 0.0094],
    "f0.22": [0.8805, 0.2665, 0.6572, 1.1021, -0.3016, -0.236, 0.9225, -0.0618, 0.3541, 0.9819, -0.1465, -0.1922, 0.0086, -0.0027, 0.01, 0.0028],
    "f0.4": [0.9073, 0.2269, 0.1805, 1.0836, -0.1261, -0.2239, 0.9707, 0.0768, 0.2827, 0.985, -0.2021, -0.0831, -0.0091, 0.0236, 0.0052, 0.0005],
    "f0.6": [0.9202, 0.2123, 0.1724, 1.0554, -0.0231, 0.0356, 1.0069, 0.1276, 0.1524, 0.9712, -0.1795, -0.0511, 0.001, 0.0102, 0.0023, -0.009],
    "f0.8": [1.1352, 0.3345, -0.0628, 1.0027, -0.1398, 0.287, 0.876, 0.1077, 0.2382, 0.8923, -0.047, 0.0937, 0.0031, 0.0078, 0.008, 0.0001],
    "f0.95": [1.439, 0.524, -1.5011, 0.9419, -0.1733, 0.4274, 0.7047, -0.0432, 0.4631, 0.7396, 0.1188, 0.388, -0.051, 0.0107, 0.0199, 0.0344],
  };

  /**
   * The row at a landmark station.
   *
   * @param station The landmark station.
   * @param s Walk length of the station, mm.
   * @returns The row, its channels in the order `IAutoMovieHumanArmPiece.IRow` states.
   */
  export function row(station: AutoMovieHumanArmStation, s: number): IAutoMovieHumanArmPiece.IRow {
    return { s, channels: [...ROWS[station]] };
  }
}
