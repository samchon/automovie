/**
 * A facial material's complete linear-light RGB override.
 *
 * Each component is in [0,1]. These channels multiply or replace the source
 * finish through the material owner; they are not sRGB bytes, an alpha value,
 * a measured skin condition or a geometric identity control.
 *
 * @evidence contracts/common.md#principled-implementation Three numeric channels preserve the linear reflectance representation used by resident materials.
 * @evidence contracts/common.md#clear-and-simple-design One complete RGB record keeps alpha and texture coverage with their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no patient preset, source texture or implicit colour conversion.
 * @evidence contracts/common.md#meaningful-documentation States the transfer convention, interval and independent alpha responsibility.
 * @evidence contracts/modeling.md#spatial-conventions Components are dimensionless linear-light reflectances; no coordinate frame or length is introduced.
 * @evidenceExclude contracts/modeling.md#parameter-channels Changes appearance without varying geometric form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A colour record defines no geometric part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The material consumer observes the finished geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries authored reflectance without inferring skin or hair biology.
 * @evidenceExclude contracts/anatomy.md#permitted-range The material owner admits reflectance rather than a physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping input.
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
