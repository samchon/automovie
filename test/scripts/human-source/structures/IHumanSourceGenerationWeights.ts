/**
 * One four-influence skin-weight map over every skin vertex. `origin` per
 * vertex: 0 published body, 1 upstream interpolated weights with the
 * extractor's storage, 2 cut-sample stencil of its two ends.
 */
export interface IHumanSourceGenerationWeights {
  joints: string[];
  boneIndices: number[];
  weights: number[];
  origin: number[];
}
