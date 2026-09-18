/**
 * Linear-RGB pigment endpoints for one iris, independent of aperture geometry.
 * Base is the limbal/dark-band albedo. Variation is a signed RGB increment at
 * the other end of the eight-band palette; zero gives uniform pigmentation.
 * Both endpoints must stay in [0,1]. This is an authored optical approximation,
 * not recovered reflectance or a photograph projected onto the eye.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates iris coloration from pupil, limbus and corneal geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines linear RGB base and signed variation endpoints whose complete eight-band interpolation remains in the unit range.
 */
export interface IPortraitIrisPigment {
  /** Exactly three linear RGB reflectances at progress zero, each in [0,1]. */
  base: readonly number[];
  /** Exactly three signed increments; base+variation must also stay in [0,1]. */
  variation: readonly number[];
}
