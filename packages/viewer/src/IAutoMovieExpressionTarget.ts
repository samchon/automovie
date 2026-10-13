/**
 * Expression sink supplied by imported runtimes such as VRM managers.
 *
 * @author Samchon
 */
export interface IAutoMovieExpressionTarget {
  /**
   * Set one normalized expression channel or preset to a weight in `[0, 1]`.
   */
  setExpressionValue: (name: string, weight: number) => void;
}
