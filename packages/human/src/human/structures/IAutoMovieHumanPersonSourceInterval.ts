/**
 * One boundary interval along an original parent-triangle side, as
 * dimensionless affine parameters from the side's start corner (0) toward its
 * end corner (1).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceInterval {
  /** Dimensionless affine parameter where the interval starts. */
  start: number;

  /** Dimensionless affine parameter where the interval ends. */
  end: number;
}
