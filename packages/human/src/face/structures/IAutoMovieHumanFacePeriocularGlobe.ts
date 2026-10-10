/**
 * One eye's globe: the surface carrying it and its attachment owner.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularGlobe {
  /** ID of the basis surface that carries the globe. */
  surface: string;

  /** Attachment owner of the globe on that surface, the articulation eye ID. */
  owner: string;
}
