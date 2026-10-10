/**
 * One used vertex's admitted normal binding: its raw source parent and, for
 * a feature binding, the global fixed-cell ordinal and its owned dimensionless
 * [u, v] chart over that cell's ordered corners. A raw binding has neither and
 * reads the canonical source chart.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalBinding {
  /** Raw parent ordinal in the source triangle tree. */
  parent: number;

  /** Global fixed normal-cell ordinal, for a feature binding. */
  cell?: number;

  /** Dimensionless [u, v] chart over that cell's corners, for a feature binding. */
  coordinates?: [number, number];
}
