/**
 * Caller-owned remaining geometry work, shared across separation measurements
 * and refinements.
 *
 * The counted work includes attachment seats, support caps, hierarchy boxes,
 * resident triangles, normal triples, projection axes and edge pairs. Keep the
 * same counter through a bounded refinement.
 */
export interface IAutoMovieMeshQueryBudget {
  /**
   * Nonnegative safe integer of remaining work. Each successful spend
   * decrements it in place before the associated geometry operation.
   */
  remaining: number;
}
