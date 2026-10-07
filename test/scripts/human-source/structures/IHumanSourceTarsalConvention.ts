/**
 * Authored outline of the tarsal plates as heights over horizontal position.
 *
 * @author Samchon
 */
export interface IHumanSourceTarsalConvention {
  /** Central height of the upper plate, metres. */
  upperHeightMetres: number;

  /** Central height of the lower plate, metres. */
  lowerHeightMetres: number;

  /** Distances from the lid centre along the margin, ascending, metres. */
  halfWidthsMetres: number[];

  /** Fraction of the central height the plate still has at each of those distances. */
  heightFractions: number[];
}
