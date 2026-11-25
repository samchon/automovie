/**
 * One runtime model's drawable geometry cost at one explicit or directly placed
 * level of detail.
 */
export interface IAutoMovieRenderModelCost {
  /** Runtime model id. */
  model: string;

  /**
   * Level-of-detail tier of this model citation, or null for direct placement
   * or mixed citations with no single tier. A request-local model-id cache
   * reuses one row and clears its tier when later citations disagree.
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

  /**
   * Present for recipe geometry: processing completeness and retained
   * realization findings, independently of drawable cost and quality.
   */
  geometryRealization?: {
    /**
     * Whether every requested recipe region finished realization within its
     * budgets.
     */
    complete: boolean;

    /** Retained realization findings; empty when no finding was produced. */
    diagnostics: string[];
  };
}
