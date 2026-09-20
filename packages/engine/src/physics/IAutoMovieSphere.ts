import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A world-space sphere collider: the simplest body to test a hit against (an
 * arrow vs. a rider's torso). Cheap, rotation-free, and enough to answer the
 * one question a strike needs: _did it connect, and when?_
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-collision-proxies Represents the bounded sphere proxy used by deterministic contact queries.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies the world-space center and radius consumed by the first-contact solve.
 * @author Samchon
 */
export interface IAutoMovieSphere {
  /**
   * Sphere center in world space.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-collision-proxies Locates the bounded contact proxy in world space.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies the center consumed by deterministic first-contact queries.
   */
  center: IAutoMovieVector3;
  /**
   * Positive radius in world meters.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-collision-proxies Bounds the spherical contact proxy with a physical radius.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Supplies the proxy extent consumed by first-contact queries.
   */
  radius: number;
}
