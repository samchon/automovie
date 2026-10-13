/** A material response owned by a deterministic collision/measurement proxy. */
export interface IAutoMovieImpactBody {
  /** Body mass in kilograms. */
  mass: number;

  /** Normal rebound ratio from zero through one. */
  restitution: number;

  /** Relative surface hardness, strictly above zero. */
  hardness: number;

  /** Relative penetration resistance, strictly above zero. */
  penetrability: number;
}
