import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * One upper arm's skin measures, separate from the humerus and its muscles.
 *
 * The maximum relaxed upper-arm circumference and shoulder-to-elbow landmark
 * distance constrain skin only. A measured biceps or triceps boundary needs
 * separate imaging; neither can be inferred from one circumference alone.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperArmSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum girth of the relaxed upper arm hanging at the side. */
    maximumRelaxedGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Palpable acromion to lateral humeral epicondyle. */
    shoulderToElbowLength?: IAutoMovieHumanBodySurfaceDistance;
  }>;
