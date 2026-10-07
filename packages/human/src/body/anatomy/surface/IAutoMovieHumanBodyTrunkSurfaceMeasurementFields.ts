import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * The trunk's independently optional exterior measurement conditions.
 * `IAutoMovieHumanBodyTrunkSurfaceMeasurements` applies the existing nonempty
 * selection rule; these fields retain their original sites, protocols and
 * target/observation carriers without converting them into internal tissue.
 *
 * @evidence contracts/common.md#principled-implementation Names the existing field population separately from its unchanged nonempty-selection rule.
 * @evidence contracts/common.md#clear-and-simple-design One cohesive trunk-condition record retains each existing independent site.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Independent optional sites retain target versus observed discriminants and optional uncertainty; the enclosing nonempty alias selects conditions without estimating internal tissue.
 * @evidence contracts/common.md#meaningful-documentation States field, selection and measurement-carrier responsibilities.
 * @evidence contracts/modeling.md#part-identity-and-grouping Groups trunk exterior conditions without defining internal solids.
 * @evidence contracts/modeling.md#parameter-channels Each existing site and side retains its own optional measurement condition; no normalization or coupling is introduced.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Girth/distance carriers use metres; double-layer skinfold carriers use millimetres. Observed method, acquisition posture and optional uncertainty retain their original protocols.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The exterior builder owns surface boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming exterior/assembly observes measured output.
 * @evidence contracts/anatomy.md#anatomical-source Named exterior sites retain their girth/distance or caliper definitions. Raw observations keep method/posture/uncertainty, authored targets remain targets, and neither category determines hidden muscle or adipose geometry.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing physical-scalar and target admission own supported conditions.
 * @evidence contracts/anatomy.md#parametric-authority Each site defines a named absolute measurement condition through the existing target/observed carrier. The nonempty alias retains selection; target conversion and achievable-source qualification remain at the anatomical target solver.
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
