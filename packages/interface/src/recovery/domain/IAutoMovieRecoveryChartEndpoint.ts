/** One exact Coons endpoint and its recipe control index. */
export interface IAutoMovieRecoveryChartEndpoint {
  /** Unscaled endpoint position, millimetres. */
  position: readonly [number, number, number];

  /** Index of the endpoint coefficient in the recipe. */
  id: number;
}
