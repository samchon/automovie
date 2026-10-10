import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * The trunk's independently optional exterior measurement conditions.
 * `IAutoMovieHumanBodyTrunkSurfaceMeasurements` applies the existing nonempty
 * selection rule; these fields retain their original sites, protocols and
 * target/observation carriers without converting them into internal tissue.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyTrunkSurfaceMeasurementFields {
  /** Horizontal chest girth at nipple height, including breast tissue. */
  bustGirth?: IAutoMovieHumanBodySurfaceGirth;

  /** Minimum horizontal trunk girth between ribs and iliac crest. */
  waistGirth?: IAutoMovieHumanBodySurfaceGirth;

  /** Rib-to-iliac midpoint waist girth, separate from the minimum-waist site. */
  ribIliacMidpointWaistGirth?: IAutoMovieHumanBodySurfaceGirth;

  /** Horizontal girth at maximal posterior buttock projection. */
  buttockGirth?: IAutoMovieHumanBodySurfaceGirth;

  /** Existing hip-breadth skin-landmark condition. */
  hipBreadth?: IAutoMovieHumanBodySurfaceDistance;

  /** Existing buttock-depth skin-landmark condition. */
  buttockDepth?: IAutoMovieHumanBodySurfaceDistance;

  /** Acromion-to-acromion skeletal landmark breadth through the skin. */
  biacromialBreadth?: IAutoMovieHumanBodySurfaceDistance;

  /** Left subscapular fold inferior to the scapular angle. */
  leftSubscapularSkinfold?: IAutoMovieHumanBodySkinfoldThickness;

  /** Independent right subscapular double-layer thickness. */
  rightSubscapularSkinfold?: IAutoMovieHumanBodySkinfoldThickness;

  /** Left suprailiac fold above the iliac crest. */
  leftSuprailiacSkinfold?: IAutoMovieHumanBodySkinfoldThickness;

  /** Independent right suprailiac fold above the iliac crest. */
  rightSuprailiacSkinfold?: IAutoMovieHumanBodySkinfoldThickness;
}
