/**
 * What one source endpoint moves on one head surface.
 *
 * @author Samchon
 */
export interface IHumanSourceEndpointSurfaceReading {
  /** Surface ID of the head view's face basis, or `landmarks` for its landmark rows. */
  surface: string;

  /** Sparse rows the endpoint stores for this surface; a stored row is nonzero. */
  movedVertices: number;

  /** Largest stored row length at unit weight, in head-frame metres. */
  maximumDisplacementMetres: number;
}
