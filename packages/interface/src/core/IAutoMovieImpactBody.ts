/**
 * A material response owned by a deterministic collision or measurement proxy.
 *
 * Only the destructible trait carries it, and only `validateProfileCapabilities`
 * (run directly, by `validateModel`, and by the production design lint) reads
 * it. The engine's collision response `resolveImpact` takes a separate engine
 * type that adds velocity; the coefficient ranges here are the ones it
 * accepts, narrowed to exclude zero hardness and penetrability, so a validated
 * trait never carries a coefficient that response would refuse.
 *
 * @evidence contracts/common.md#principled-implementation `validateProfileCapabilities` requires a finite positive mass, restitution in `[0, 1]`, and hardness and penetrability in `(0, 1]`, the unit coefficients `resolveImpact` reads against its fixed bounce, embed and pass-through thresholds.
 * @evidence contracts/common.md#clear-and-simple-design The trait stores only the static material facts a proxy owns; velocity belongs to an impact, so the engine's response type adds it rather than this record carrying a placeholder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-range coefficients are refused at validation rather than clamped when a future verb reads them, and the documentation states that no engine verb consumes the trait yet.
 * @evidence contracts/common.md#meaningful-documentation States who carries and reads the record, how it relates to the engine's response type, and each field's unit and accepted range.
 * @author Samchon
 */
export interface IAutoMovieImpactBody {
  /** Body mass in kilograms; finite and positive. */
  mass: number;

  /** Normal rebound ratio, from zero through one. */
  restitution: number;

  /** Relative surface hardness, above zero and at most one (a hard shell). */
  hardness: number;

  /**
   * Relative ease of being pierced, above zero and at most one (a soft target
   * an arrow sinks into).
   */
  penetrability: number;
}
