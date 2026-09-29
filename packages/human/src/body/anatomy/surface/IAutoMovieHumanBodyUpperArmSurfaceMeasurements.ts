import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * One upper arm's skin measures, separate from the humerus and its muscles.
 *
 * The mid-upper-arm circumference and shoulder-to-elbow landmark
 * distance constrain skin only. A measured biceps or triceps boundary needs
 * separate imaging; neither can be inferred from one circumference alone.
 * PhenX protocol PX021102 defines mid-upper-arm circumference between the
 * acromion and olecranon, distinct from a maximum inside the legacy basis's
 * shoulder–elbow search band.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperArmSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Girth halfway from acromion to olecranon with the arm relaxed at the side; this is the clinical MUAC station, not a biceps maximum. */
    midUpperArmGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Palpable acromion to lateral humeral epicondyle. */
    shoulderToElbowLength?: IAutoMovieHumanBodySurfaceDistance;
  }>;
