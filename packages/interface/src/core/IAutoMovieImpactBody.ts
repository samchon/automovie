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
 * @evidence contracts/common.md#principled-implementation Mass and the three material coefficients that the normal-impulse response and the bounce, embed and pass-through heuristic of `resolveImpact` consume; the validators check mass, hardness and penetrability for finite positive values and restitution against `[0, 1]`.
 * @evidence contracts/common.md#clear-and-simple-design Carries no velocity because a trait declares a material at rest and a collision supplies motion; it nearly duplicates the engine's `physics/IAutoMovieImpactBody`, which adds velocity under the same name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The coefficient ranges diverge from the engine collision type, positive-only here against `[0, 1]` in `resolveImpact`, a contract mismatch stated honestly and reported as a finding rather than reconciled in this change.
 * @evidence contracts/common.md#meaningful-documentation Gives the mass unit, the checked range of every coefficient, who reads the record today, and the range mismatch with the engine collision type.
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
