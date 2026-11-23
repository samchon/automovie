/**
 * Compliance of each lattice constraint family, the inverse of its stiffness,
 * in metres per newton: how far a constraint gives under a newton of force.
 *
 * The extended position-based solver (XPBD: Macklin, Müller and Chentanez 2016,
 * "XPBD: position-based simulation of compliant constrained dynamics", MIG
 * 2016, pp. 49-54) projects each constraint with its own Lagrange multiplier
 * and this compliance scaled by the step squared, so the stiffness a family
 * shows does not change with the sweep count or the step, unlike the relaxation
 * weights of `IAutoMovieSoftStiffness`. Zero is a rigid constraint: an
 * inextensible cord, a sheet that does not stretch.
 */
export interface IAutoMovieSoftCompliance {
  /**
   * Row and column neighbours: a cord's or a sheet's stretch, metres per
   * newton; not negative.
   */
  structural: number;

  /** Diagonal neighbours: a sheet's shear, metres per newton; not negative. */
  shear: number;

  /**
   * Second neighbours along a row or column: bending in distance form, metres
   * per newton; not negative.
   */
  bend: number;
}
