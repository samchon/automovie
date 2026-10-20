/**
 * One compact instance set's exact population and conservative batching peak.
 *
 * @evidence contracts/common.md#principled-implementation Compiled slot and chunk counts are exact while draw submissions are bounded over chunks, available prototypes and the most expensive drawable LOD part population; culling and selection only reduce that peak.
 * @evidence contracts/common.md#clear-and-simple-design Separates logical population size and prototype count from submission bound so compact sets are not priced as one scene node or expanded dense members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A legacy one-prototype set explicitly counts one; no average LOD or sampled visible subset understates the conservative admissible frame cost.
 * @evidence contracts/common.md#meaningful-documentation Defines set id, exact slots/chunks/prototypes and the upper-bound nature of draw calls.
 */
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
   * Upper bound on draw submissions: one per chunk, per prototype, per drawn part of the prototype's most expensive level of detail. Frustum and LOD selection only ever lower it.
   */
  drawCallUpperBound: number;
}
