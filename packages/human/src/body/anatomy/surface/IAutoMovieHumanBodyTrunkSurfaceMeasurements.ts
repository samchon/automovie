import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * Target or observed exterior chest, waist and buttock dimensions, with hip
 * breadth (ANSUR II 6.4.51) and buttock depth (6.4.18) at the pelvis.
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
    /** Horizontal waist girth halfway from lowest palpable rib to iliac crest; separate from the minimum-waist protocol. */
    ribIliacMidpointWaistGirth?: IAutoMovieHumanBodySurfaceGirth;
    /** Horizontal girth at the maximal posterior buttock projection. */
    buttockGirth?: IAutoMovieHumanBodySurfaceGirth;
    hipBreadth?: IAutoMovieHumanBodySurfaceDistance;
    buttockDepth?: IAutoMovieHumanBodySurfaceDistance;
    /** Acromion-to-acromion skeletal landmark breadth through the skin. */
    biacromialBreadth?: IAutoMovieHumanBodySurfaceDistance;
    /** Left fold inferior to scapular angle, separate from muscle volume. */
    leftSubscapularSkinfold?: IAutoMovieHumanBodySkinfoldThickness;
    /** Independent right subscapular double-layer thickness. */
    rightSubscapularSkinfold?: IAutoMovieHumanBodySkinfoldThickness;
    /** Left suprailiac fold above iliac crest. */
    leftSuprailiacSkinfold?: IAutoMovieHumanBodySkinfoldThickness;
    /** Right suprailiac fold above iliac crest. */
    rightSuprailiacSkinfold?: IAutoMovieHumanBodySkinfoldThickness;
  }>;
