/**
 * A material response owned by a deterministic collision/measurement proxy.
 *
 * Only the destructible trait carries it, and only
 * `validateProfileCapabilities` and the production design lint read it. The
 * engine's collision response
 * `resolveImpact` takes a separate engine type that adds velocity and requires
 * hardness and penetrability within `[0, 1]`, so a coefficient above one passes
 * here but would be refused there.
 *
 * @author Samchon
 */
export interface IAutoMovieImpactBody {
  /** Body mass in kilograms; finite and positive. */
  mass: number;

  /** Normal rebound ratio from zero through one. */
  restitution: number;

  /**
   * Relative surface hardness, strictly above zero; no upper bound is checked.
   */
  hardness: number;

  /**
   * Relative penetration resistance, strictly above zero; no upper bound is
   * checked.
   */
  penetrability: number;
}
