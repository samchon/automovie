/**
 * Result of `solveHumanBodyMeasuredChannel`: the fresh shape with the solved
 * channel's weight, and the instrument's reading on it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredChannelSolution {
  /** The solved shape. */
  shape: Record<string, number>;

  /** The instrument's reading on that shape, metres. */
  actualMetres: number;
}
