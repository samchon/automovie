/** Open edge of the cut skin, directed as its triangle winds it. */
export interface IAutoMovieHumanApertureEdge {
  /** Start vertex. */
  u: number;

  /** End vertex. */
  v: number;

  /** Third vertex of the retained skin triangle owning this edge. */
  inside: number;

  /** Group of the triangle the edge bounds. */
  name: string;
}
