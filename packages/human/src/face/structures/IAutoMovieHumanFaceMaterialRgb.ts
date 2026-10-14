/**
 * A facial material's complete linear-light RGB override.
 *
 * Each component is in [0,1]. These channels multiply or replace the source
 * finish through the material owner; they are not sRGB bytes, an alpha value,
 * a measured skin condition or a geometric identity control.
 *
 * @evidence contracts/common.md#principled-implementation The builder replaces the source material's RGB factor with these complete linear channels; generated fibre finish may multiply its independent pigment by that material factor.
 * @evidence contracts/common.md#clear-and-simple-design Explicit r/g/b channels avoid mixing a hexadecimal source token, alpha or sRGB bytes with the numerical override.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consuming material admission checks finite [0,1] values and clears the old hex token; these authored reflectances neither reconstruct photographed complexion nor alter anatomy.
 * @evidence contracts/common.md#meaningful-documentation Linear-light reflectance and channel bounds distinguish colour factors from texture samples and geometric controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This RGB record performs no colour-space conversion or shading.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares three values without caching equivalent material work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No texture or renderer material is allocated here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMaterialRgb {
  /** Linear red reflectance in [0,1]. */
  r: number;

  /** Linear green reflectance in [0,1]. */
  g: number;

  /** Linear blue reflectance in [0,1]. */
  b: number;
}
