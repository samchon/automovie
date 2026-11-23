/** One compact instance set's exact population and conservative batching peak. */
export interface IAutoMovieRenderInstanceSetCost {
  /** Compiled instance-set id. */
  instanceSet: string;

  /** Exact designed slot count. */
  slots: number;

  /** Exact independently regenerable chunk count. */
  chunks: number;

  /** Exact prototype count; a legacy single-prototype set reports one. */
  prototypes: number;

  /**
   * Upper bound on draw submissions: one per chunk, per prototype, per drawn
   * part of the prototype's most expensive level of detail. Frustum and LOD
   * selection only ever lower it.
   */
  drawCallUpperBound: number;
}
