/**
 * Dimensionless relaxation weight of each lattice constraint family.
 *
 * @evidence contracts/common.md#principled-implementation The Jacobi solver multiplies each distance correction by its family weight and divides the gathered result by particle valence; validateSoftBodyDomain requires finite weights in [0, 1].
 * @evidence contracts/common.md#clear-and-simple-design Three scalar weights correspond directly to the supported neighbour families without a material-law abstraction the current solver does not evaluate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These values are relaxation weights rather than physical elastic moduli; increasing them does not certify inextensibility at a finite sweep count.
 * @evidence contracts/common.md#meaningful-documentation Member comments identify structural, diagonal and second-neighbour responsibilities and their dimensionless range.
 */
export interface IAutoMovieSoftStiffness {
  /** Row and column neighbours: resists stretching. */
  structural: number;

  /** Diagonal neighbours: resists shearing, which is what makes cloth drape. */
  shear: number;

  /** Second neighbours along a row or column: resists folding too sharply. */
  bend: number;
}
