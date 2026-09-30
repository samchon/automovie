/**
 * Linear-RGB pigment endpoints for one iris, independent of aperture geometry.
 * Base is the limbal/dark-band albedo. Variation is a signed RGB increment at
 * the other end of the eight-band palette; zero gives uniform pigmentation.
 * Both endpoints must stay in [0,1]. This is an authored optical approximation,
 * not recovered reflectance or a photograph projected onto the eye.
 * @author Samchon
 */
export interface IPortraitIrisPigment {
  /** Exactly three linear RGB reflectances at progress zero, each in [0,1]. */
  base: readonly number[];

  /** Exactly three signed increments; base+variation must also stay in [0,1]. */
  variation: readonly number[];
}
