/**
 * One absorbing surface of a room.
 *
 * Contributes `area * absorption` to the Sabine absorption area. When every
 * surface absorbs nothing, or every surface absorbs completely, the room has no
 * finite diffuse field, and the reverberation time and room constant are
 * reported as gaps.
 *
 * @author Samchon
 */
export interface IAutoMovieAcousticSurface {
  /** Stable surface identity, unique among the request's surfaces. */
  id: string;

  /** Area in m^2; finite and strictly positive. */
  area: number;

  /** Broadband Sabine absorption coefficient within `[0, 1]`, both ends included. */
  absorption: number;
}
