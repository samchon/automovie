/**
 * Linear-RGB pigment endpoints for one iris, independent of aperture geometry.
 * Base is the limbal/dark-band albedo. Variation is a signed RGB increment at
 * the other end of the eight-band palette; zero gives uniform pigmentation.
 * Both endpoints must stay in [0,1]. This is an authored optical approximation,
 * not recovered reflectance or a photograph projected onto the eye.
 *
 *
 * @evidence contracts/common.md#principled-implementation Two linear-RGB endpoints define an eight-band convex palette independently of aperture geometry.
 * @evidence contracts/common.md#clear-and-simple-design createPortraitIrisMaterials owns three-channel/range admission and all optical consumers share that palette.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The authored palette is not recovered reflectance or a projected source photograph.
 * @evidence contracts/common.md#meaningful-documentation Fields state exactly three base/increment channels and both endpoints in the unit interval.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitIrisPigment is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitIrisPigment declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitIrisPigment acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IPortraitIrisPigment {
  /** Exactly three linear RGB reflectances at progress zero, each in [0,1]. */
  base: readonly number[];

  /** Exactly three signed increments; base+variation must also stay in [0,1]. */
  variation: readonly number[];
}
