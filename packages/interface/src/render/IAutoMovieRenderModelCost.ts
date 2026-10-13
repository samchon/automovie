/** One model's exact geometry cost at one level of detail. */
export interface IAutoMovieRenderModelCost {
  /** Runtime model id. */
  model: string;

  /**
   * Level-of-detail tier this row measures, or `null` for a model placed
   * directly by a scene node rather than selected by distance.
   */
  tier: "hero" | "near" | "far" | null;

  /** Exact drawable part count; one part is one draw submission. */
  parts: number;

  /** Exact vertex count over every part. */
  vertices: number;

  /** Exact triangle count over every part. */
  triangles: number;

  /** Distinct material ids cited by the parts. */
  materials: string[];

  /** Estimated device bytes of vertex attributes and indices. */
  geometryBytes: number;
}
