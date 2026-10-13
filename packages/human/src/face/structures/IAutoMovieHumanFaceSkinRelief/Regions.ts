import type { IAutoMovieHumanFaceRegionalRelief } from "../IAutoMovieHumanFaceRegionalRelief";

/**
 * Source-landmark courses, independent of raw skin-condition observations.
 *
 * @evidence contracts/common.md#principled-implementation Named source landmarks and explicit forehead/glabellar metric guides define the supported regional courses on the same live connected skin, with independent signed identity and performed fold.
 * @evidence contracts/common.md#clear-and-simple-design Eight optional canonical RegionalRelief fields keep source-course selection separate from common depth/width controls and the ocular cage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical grades never enter these fields, omitted regions add no relief, and unsupported course dimensions or missing active material support refuse rather than supplying free curves.
 * @evidence contracts/common.md#meaningful-documentation Each field names its actual landmark course and anatomical side, including explicit guide requirements and held lip margin.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This region schema performs no landmark read or course compilation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared region type implements no identity-reference or performed-curve cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional caller dimensions create no skin host or derivative arrays.
 *
 * @author Samchon
 */
export interface Regions {
  /** Horizontal forehead course above source glabella; explicit length/elevation in mm, independent rest/fold traits, omitted for no added relief. */
  forehead?: IAutoMovieHumanFaceRegionalRelief;

  /** Superior glabellar course from source glabella with explicit mm length; rest offset and performed fold remain independent. */
  glabellar?: IAutoMovieHumanFaceRegionalRelief;

  /** Anatomical-left cheilion-to-gnathion authored course on the connected anterior skin; omission adds no left relief. */
  marionetteLeft?: IAutoMovieHumanFaceRegionalRelief;

  /** Anatomical-right cheilion-to-gnathion authored course, independently omitted or performed from the left. */
  marionetteRight?: IAutoMovieHumanFaceRegionalRelief;

  /** Left source crista-philtri-to-subnasale course, confined to anatomical +X; authored mm relief is separate from clinical grades. */
  philtralLeft?: IAutoMovieHumanFaceRegionalRelief;

  /** Right source crista-philtri-to-subnasale course, confined to anatomical -X; neither identity nor performance inherits the left. */
  philtralRight?: IAutoMovieHumanFaceRegionalRelief;

  /** Cheilion-to-labiale-superius-to-cheilion source course; independent mm identity/fold support holds the registered lip margin. */
  perioralUpper?: IAutoMovieHumanFaceRegionalRelief;

  /** Cheilion-to-labiale-inferius-to-cheilion source course; independent lower mm identity/fold support, omitted for no added relief. */
  perioralLower?: IAutoMovieHumanFaceRegionalRelief;
}
