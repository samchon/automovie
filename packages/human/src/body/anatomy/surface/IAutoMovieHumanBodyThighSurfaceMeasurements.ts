import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * One thigh's skin dimensions, distinct from the underlying femur.
 *
 * Its maximum circumference and hip-to-knee landmark length do not identify
 * quadriceps, hamstring or adipose volumes, or the femoral neck angle.
 * @author Samchon
 */
export type IAutoMovieHumanBodyThighSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum girth of the standing thigh perpendicular to its long axis. */
    maximumGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Greater trochanter to lateral femoral epicondyle on the same side. */
    hipToKneeLength?: IAutoMovieHumanBodySurfaceDistance;
  }>;
