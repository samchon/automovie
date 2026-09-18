/**
 * A material response owned by a deterministic collision/measurement proxy.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes `IAutoMovieImpactBody` as the portable data boundary for the effects impact consequence requirement.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Types `IAutoMovieImpactBody` for the collision proxy and world contact output system contract.
 */
export interface IAutoMovieImpactBody {
  /**
   * Body mass in kilograms.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes `mass` as the portable data boundary for the effects impact consequence requirement.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Types `mass` for the collision proxy and world contact output system contract.
   */
  mass: number;
  /**
   * Normal rebound ratio from zero through one.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes `restitution` as the portable data boundary for the effects impact consequence requirement.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Types `restitution` for the collision proxy and world contact output system contract.
   */
  restitution: number;
  /**
   * Relative surface hardness, strictly above zero.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes `hardness` as the portable data boundary for the effects impact consequence requirement.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Types `hardness` for the collision proxy and world contact output system contract.
   */
  hardness: number;
  /**
   * Relative penetration resistance, strictly above zero.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes `penetrability` as the portable data boundary for the effects impact consequence requirement.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Types `penetrability` for the collision proxy and world contact output system contract.
   */
  penetrability: number;
}
