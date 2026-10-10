/** Computational resolution of the existing vertex AO bake.
 *
 * @author Samchon
 */
export interface IHumanFaceOcclusionBakeOptions {
  /** Positive integer cosine-weighted rays per receiving vertex. */
  rays: number;

  /** Positive integer edge length of each output texture in pixels. */
  size: number;
}
