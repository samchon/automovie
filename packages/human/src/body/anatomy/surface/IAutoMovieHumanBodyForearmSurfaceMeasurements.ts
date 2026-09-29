import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * One forearm's outer dimensions, independent of radius and ulna geometry.
 *
 * Maximum circumference includes muscle, fat and skin. Elbow-to-wrist
 * landmark length is not the length of either of the two forearm bones.
 * @author Samchon
 */
export type IAutoMovieHumanBodyForearmSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum girth of the relaxed forearm perpendicular to its long axis. */
    maximumGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Girth immediately proximal to the wrist's styloid processes. */
    wristGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Lateral humeral epicondyle to the radial styloid. */
    elbowToWristLength?: IAutoMovieHumanBodySurfaceDistance;
  }>;
