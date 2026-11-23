/**
 * A material response owned by a deterministic collision or measurement proxy.
 *
 * The destructible trait carries it and validateProfileCapabilities checks its
 * static fields. resolveImpact takes a separate Engine type that adds velocity;
 * its hardness and penetrability ranges include zero, while the profile trait
 * deliberately requires both above zero. Validating this record does not
 * execute an impact response.
 */
export interface IAutoMovieImpactBody {
  /** Body mass in kilograms; finite and positive. */
  mass: number;

  /** Normal rebound ratio, from zero through one. */
  restitution: number;

  /** Relative surface hardness, above zero and at most one (a hard shell). */
  hardness: number;

  /**
   * Relative ease of being pierced, above zero and at most one; a declared
   * material coefficient rather than proof that an impact was simulated.
   */
  penetrability: number;
}
