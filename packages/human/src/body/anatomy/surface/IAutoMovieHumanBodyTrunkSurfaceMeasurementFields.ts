import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * The trunk's independently optional exterior measurement conditions. `IAutoMovieHumanBodyTrunkSurfaceMeasurements` applies the existing nonempty selection rule; these fields retain their original sites, protocols and target/observation carriers without converting them into internal tissue.
 *
 * @evidence contracts/common.md#principled-implementation Optional trunk fields preserve distinct bust/waist/buttock stations, skin breadth/depth and independently sided folds under shared quantity provenance.
 * @evidence contracts/common.md#clear-and-simple-design This field owner centralizes eleven trunk sites; its separate nonempty alias owns the requirement to supply a condition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Minimum waist and rib-iliac midpoint waist stay distinct, and skin distances or folds do not become internal tissue volumes.
 * @evidence contracts/common.md#meaningful-documentation Members define horizontal stations, external breadth/depth and separate left/right fold sites.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Trunk field typing executes no circumference sectioning or adipose-volume solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Optional site metadata holds no evaluated trunk acquisition result across body states.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Trunk fields own no section stacks, skinfold simulation or source-instrument task.
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
