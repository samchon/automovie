/**
 * Eligible static surfaces for one interval of a staged actor's performance.
 *
 * List adjoining surfaces together while crossing a threshold or landing. At a
 * point covered by more than one eligible surface, the locator chooses the
 * height closest to the queried world Y. Ties retain listed order. An empty
 * list suspends static grounding for a carrier or airborne interval.
 */
export interface IAutoMovieStageSupportWindow {
  /** Inclusive start in shot-local seconds. The first window starts at zero. */
  from: number;

  /** Ordered ids from the staged space's walkable surfaces. */
  surfaces: readonly string[];
}
