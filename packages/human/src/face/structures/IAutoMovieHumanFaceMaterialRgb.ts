/**
 * A facial material's complete linear-light RGB override.
 *
 * Each component is in [0,1]. These channels multiply or replace the source
 * finish through the material owner; they are not sRGB bytes, an alpha value,
 * a measured skin condition or a geometric identity control.
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
