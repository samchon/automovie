import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * Target or observed exterior chest, waist and buttock dimensions.
 *
 * Each landmark must be reproduced by the same named measurement on the
 * generated standing skin. A bust girth includes overlying breast tissue;
 * neither it nor a waist or buttock girth measures the internal organ, muscle
 * or adipose volumes. These are independent conditions, not a request to
 * move selected skin vertices until a preferred silhouette appears.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTrunkSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Horizontal chest girth at nipple height, including breast tissue. */
    bustGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Minimum horizontal trunk girth between ribs and iliac crest. */
    waistGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Horizontal girth at the maximal posterior buttock projection. */
    buttockGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Acromion-to-acromion skeletal landmark breadth through the skin. */
    biacromialBreadth?: IAutoMovieHumanBodySurfaceDistance;
  }>;
