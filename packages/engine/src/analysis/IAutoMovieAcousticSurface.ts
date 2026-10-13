/** One absorbing surface of a room. */
export interface IAutoMovieAcousticSurface {
  /** Stable surface identity within the request. */
  id: string;
  /** Area in m^2; strictly positive. */
  area: number;
  /** Sabine absorption coefficient within `[0, 1]`. */
  absorption: number;
}
