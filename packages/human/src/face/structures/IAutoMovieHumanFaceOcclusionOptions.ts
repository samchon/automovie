/**
 * Ambient-occlusion sampling for a face basis builder's baked occlusion texture.
 *
 * `rays` is the hemisphere ray count per texel and `size` the square texture
 * edge in texels; `bakeHumanFaceOcclusion` owns their admission and meaning.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOcclusionOptions {
  /** Rays per texel. */
  rays: number;

  /** Square texture size in texels. */
  size: number;
}
