import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";

/**
 * One hand's overall skin length and breadth, with no authored finger mesh.
 *
 * Overall dimensions leave palm and digit proportions unknown. A future
 * hand generator must report its source and validation for those proportions.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHandSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Distal wrist crease to the tip of the middle finger. */
    length?: IAutoMovieHumanBodySurfaceDistance;
    /** Width across the second through fifth metacarpal heads. */
    breadth?: IAutoMovieHumanBodySurfaceDistance;
  }>;
