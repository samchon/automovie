/**
 * Ambient-occlusion sampling for a face basis builder's baked occlusion texture.
 *
 * `rays` is the hemisphere ray count per texel and `size` the square texture
 * edge in texels; `bakeHumanFaceOcclusion` owns their admission and meaning.
 *
 * @evidence contracts/common.md#principled-implementation The two integers are the occlusion baker's own sampling options, passed through unchanged.
 * @evidence contracts/common.md#clear-and-simple-design A named carrier of the two existing options replaces an anonymous object type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default is invented here; omission belongs to the builder.
 * @evidence contracts/common.md#meaningful-documentation States both fields, their units and the owning baker.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The options define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The options are not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The options emit no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Counts carry no frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The options build no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder owns what the bake shows.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The options carry no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The options admit no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The options do not shape a person.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOcclusionOptions {
  /** Rays per texel. */
  rays: number;

  /** Square texture size in texels. */
  size: number;
}
