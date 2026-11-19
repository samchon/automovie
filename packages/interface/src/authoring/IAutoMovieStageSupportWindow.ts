/**
 * Eligible static surfaces for one interval of a staged actor's performance.
 *
 * List adjoining surfaces together while crossing a threshold or landing.
 * At a point covered by more than one eligible surface, the locator chooses
 * the height closest to the queried world Y. Ties retain listed order. An
 * empty list suspends static grounding for a carrier or airborne interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines shot-local seconds, reference domain, overlap ordering, crossing use and explicit suspension.
 * @evidence contracts/development/design.md#principled-representation One timestamp delimits an interval on the shot clock. Stage admission checks strictly increasing starts and distinct walkable references. A point query compares actual heights in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Identifies existing surfaces without copying their geometry or defining a separate floor model. The next window's start, or the shot end, determines length.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty surfaces means explicit static suspension, while a nonempty scope with no covering surface has no support. Neither substitutes the legacy global ground query.
 */
export interface IAutoMovieStageSupportWindow {
  /** Inclusive start in shot-local seconds. The first window starts at zero. */
  from: number;

  /** Ordered ids from the staged space's walkable surfaces. */
  surfaces: readonly string[];
}
