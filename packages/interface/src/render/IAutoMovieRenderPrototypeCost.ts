/** What one instance of a renderer-chosen prototype costs to draw. */
export interface IAutoMovieRenderPrototypeCost {
  /** Exact vertex count of one instance; a non-negative integer. */
  vertices: number;

  /** Exact triangle count of one instance; a non-negative integer. */
  triangles: number;
}
