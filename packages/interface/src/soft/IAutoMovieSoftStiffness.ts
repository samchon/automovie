/** Dimensionless relaxation weight of each lattice constraint family. */
export interface IAutoMovieSoftStiffness {
  /** Row and column neighbours: resists stretching. */
  structural: number;

  /** Diagonal neighbours: resists shearing, which is what makes cloth drape. */
  shear: number;

  /** Second neighbours along a row or column: resists folding too sharply. */
  bend: number;
}
