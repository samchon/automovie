import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A colliding body, reduced to what a collision _response_ needs: how heavy it
 * is, how fast it is going, and the material traits that decide whether a hit
 * bounces, embeds, or passes through. This is deliberately abstract: the point
 * (per the project's direction) is to compute a high-level, deterministic
 * _result_ an AI can be handed as a hint, not to run a full rigid-body sim.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Reduces authored bodies to the traits needed for a deterministic impact result.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies the physical inputs consumed after contact is established.
 * @author Samchon
 */
export interface IAutoMovieImpactBody {
  /**
   * Mass (kg); larger = harder to move.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Determines the impulse split between contacted bodies.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies the inertial input used to compute the response.
   */
  mass: number;
  /**
   * Linear velocity (world m/s).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Determines closing speed and post-impact motion.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies the world velocity at contact.
   */
  velocity: IAutoMovieVector3;
  /**
   * Bounciness `[0,1]`: how much closing speed is returned.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Selects how much normal motion rebounds after contact.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies the bounded restitution trait of the response.
   */
  restitution: number;
  /**
   * Rigidity `[0,1]`: 1 a hard shell, 0 soft flesh.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Distinguishes bounce and deflection material outcomes.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies one material trait used by the qualitative contact result.
   */
  hardness: number;
  /**
   * How easily this body is pierced `[0,1]`: 1 a soft target an arrow sinks
   * into.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Selects embed or pass-through outcomes for fast strikes.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies the penetration trait used by the bounded response heuristic.
   */
  penetrability: number;
}
