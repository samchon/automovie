/**
 * Upper and lower midline vertices on one face basis surface.
 *
 * The contact owner reads the pair's posed separation along the basis frame's
 * vertical, made perpendicular to the mandibular axis, as an aperture: the
 * vermilion seam pair gives the interlabial and the incisal edge pair the
 * interincisal aperture. Both vertices are found once on the shared topology.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMidlinePair {
  /** ID of the basis surface both vertices belong to. */
  surface: string;

  /** Upper midline vertex index on that surface. */
  upper: number;

  /** Lower midline vertex index on that surface. */
  lower: number;
}
