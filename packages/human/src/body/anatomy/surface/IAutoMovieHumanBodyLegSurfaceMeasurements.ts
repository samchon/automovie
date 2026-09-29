import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * Exterior dimensions of one anatomical leg between knee and ankle.
 *
 * Calf size includes gastrocnemius, soleus and overlying tissues; the
 * knee-to-ankle skin distance cannot stand in for tibia or fibula length.
 * The knee and ankle girths delimit distinct joints and remain independent.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLegSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Horizontal girth across the middle of the patella. */
    kneeGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Greatest relaxed calf girth perpendicular to the leg axis. */
    maximumCalfGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Smallest girth above the medial and lateral malleoli. */
    ankleGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Lateral femoral epicondyle to the lateral malleolus. */
    kneeToAnkleLength?: IAutoMovieHumanBodySurfaceDistance;
  }>;
