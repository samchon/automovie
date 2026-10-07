/** Computational resolution of the existing vertex AO bake.
 *
 * @evidence contracts/common.md#principled-implementation Separates directional sampling count from raster resolution because the bake uses each in a different numerical stage.
 * @evidence contracts/common.md#clear-and-simple-design One resolution record transports the two existing bake controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves requested resolution without subject-dependent values or alternative bake paths.
 * @evidence contracts/common.md#meaningful-documentation Documents integer units; bakeHumanFaceOcclusion admits positive integer resolutions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels Transports computational inputs and defines no form-varying channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no joined surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part or joint; the assembled consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Establishes no anatomical quantity or physiological source.
 * @evidenceExclude contracts/anatomy.md#permitted-range Owns no physiological range; anatomical admission remains with its input owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no public measurement or physiological control for shaping a person.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no spatial quantity or conversion.
 * @author Samchon
 */
export interface IHumanFaceOcclusionBakeOptions {
  /** Positive integer cosine-weighted rays per receiving vertex. */
  rays: number;

  /** Positive integer edge length of each output texture in pixels. */
  size: number;
}
