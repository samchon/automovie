import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * One thigh's skin dimensions, distinct from the underlying femur.
 *
 * Its mid-thigh circumference and hip-to-knee landmark length do not identify
 * quadriceps, hamstring or adipose volumes, or the femoral neck angle.
 * @author Samchon
 */
export type IAutoMovieHumanBodyThighSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Girth at the midpoint of the trochanterion–tibiale-laterale line, perpendicular to the thigh axis. */
    midThighGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Anterior mid-thigh double-layer skinfold, not quadriceps volume. */
    anteriorSkinfold?: IAutoMovieHumanBodySkinfoldThickness;
    /** Greater trochanter to the lateral tibial condyle on the same side. */
    hipToKneeLength?: IAutoMovieHumanBodySurfaceDistance;
  }>;
