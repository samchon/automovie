import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * One thigh's skin dimensions, distinct from the underlying femur.
 *
 * Its mid-thigh circumference and hip-to-knee landmark length do not identify quadriceps, hamstring or adipose volumes, or the femoral neck angle.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty thigh girth, anterior skinfold and hip-knee span retain distinct surface protocols rather than internal tissue quantities.
 * @evidence contracts/common.md#clear-and-simple-design Shared girth/skinfold/distance types own acquisition semantics while this region owns their anatomical sites.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These exterior conditions cannot identify muscle/adipose volume or femoral neck angle.
 * @evidence contracts/common.md#meaningful-documentation Members identify the thigh midpoint, double-layer fold and same-side skin landmark endpoints.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Thigh surface typing performs no femoral-neck inference or compartment segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The thigh condition record stores no reusable quadriceps/hamstring volume reconstruction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its surface quantities acquire no thigh section mesh or tissue-estimation workspace.
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
