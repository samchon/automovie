import { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieImpactKind } from "./AutoMovieImpactKind";

/**
 * The abstracted result of one collision: the contact normal, the impulse
 * delivered, the closing speed, both bodies' post-impact velocities, and a
 * qualitative {@link AutoMovieImpactKind}. One value serves both consumers: an
 * AI hint ("recoil this hard, this way; it embeds") and a deterministic driver
 * for auto-played aftermath.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Carries impulse, motion, and qualitative aftermath as one contact result.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Exposes the deterministic output of the bounded collision response.
 */
export interface IAutoMovieImpact {
  /**
   * Unit contact normal, from `a` toward `b`.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Preserves the direction along which contact response is resolved.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries the world contact normal used by downstream reaction.
   */
  normal: IAutoMovieVector3;
  /**
   * Closing speed along the normal at contact (0 if not approaching).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Quantifies the severity of the resolved contact.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Reports the measured normal closing speed at contact.
   */
  speed: number;
  /**
   * Impulse delivered to `b` (the equal and opposite acts on `a`).
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Carries the deterministic impulse that drives aftermath.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Reports the bounded response derived from world contact.
   */
  impulse: IAutoMovieVector3;
  /**
   * `a`'s velocity after the impact.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes the first body's deterministic post-contact motion.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries one side of the contact response output.
   */
  velocityA: IAutoMovieVector3;
  /**
   * `b`'s velocity after the impact.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes the second body's deterministic post-contact motion.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries the other side of the contact response output.
   */
  velocityB: IAutoMovieVector3;
  /**
   * What happened.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Names the bounce, embed, through, or deflect aftermath.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Classifies the contact output for authored reaction logic.
   */
  kind: AutoMovieImpactKind;
}
