/**
 * Polar hairline mask of a connected numerical hair layer.
 * Squared azimuth weights blend the four angles and only reduce shared growth.
 *
 * @evidence contracts/common.md#principled-implementation Squared front/back and left/right azimuth weights interpolate a polar cap inside the shared growth domain, so the mask can remove roots but cannot grow outside registered triangles.
 * @evidence contracts/common.md#clear-and-simple-design Four head-frame angles describe the domain mask; the root sampler combines it with the actual neutral triangle population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These authored angular limits are not a personal measured hairline or an expansion of the shared domain.
 * @evidence contracts/common.md#meaningful-documentation Each directional member states its [0,pi] radian domain and common +Y polar origin.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Four angular limits execute no azimuth blend or area-weighted root sampling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mask record declares no sampled-root equivalence or domain compiler cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Hairline values allocate no population or triangle index; their layer and domain sampler own actual storage.
 * @author Samchon
 */
export interface IHumanFaceHairLayerHairline {
  /** Anterior polar angle from +Y, in [0,pi] radians. */
  front: number;

  /** Anatomical-left polar angle from +Y, in [0,pi] radians. */
  left: number;

  /** Anatomical-right polar angle from +Y, in [0,pi] radians. */
  right: number;

  /** Posterior polar angle from +Y, in [0,pi] radians. */
  back: number;
}
