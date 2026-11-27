/** One complete positive-depth pixel score on a fixed resection population. */
export interface IAutoMovieRecoveryResectionScore {
  /** Ascending indices in the unchanged 3D/pixel input arrays. */
  indices: number[];

  /** Sum of squared pixel errors clipped at the declared support threshold. */
  cost: number;
}
