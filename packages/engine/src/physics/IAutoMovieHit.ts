import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A detected hit: the parameter/time of first contact and the contact point.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Exposes the resolved first contact of a bounded collision query.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries the time and world point of contact.
 */
export interface IAutoMovieHit {
  /**
   * Time (or segment parameter) of first contact.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Identifies when the deterministic contact begins.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Reports the first-contact parameter of the query.
   */
  time: number;
  /**
   * World point of first contact.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Identifies where the deterministic contact begins.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Reports the resolved world-space contact output.
   */
  point: IAutoMovieVector3;
}
