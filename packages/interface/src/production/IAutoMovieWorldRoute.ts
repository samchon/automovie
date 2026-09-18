/**
 * A named route whose width constrains formations.
 *
 * @evidence requirements/map/movement-and-visibility.md#map-route-connectivity Exposes `IAutoMovieWorldRoute` as the portable data boundary for the map route connectivity requirement.
 * @evidence specifications/world-and-site/traversal-and-visibility.md#world-site-route-connectivity-time-state Types `IAutoMovieWorldRoute` for the world site route connectivity time state system contract.
 */
export interface IAutoMovieWorldRoute {
  /**
   * Stable route id.
   *
   * @evidence requirements/map/movement-and-visibility.md#map-route-connectivity Exposes `id` as the portable data boundary for the map route connectivity requirement.
   * @evidence specifications/world-and-site/traversal-and-visibility.md#world-site-route-connectivity-time-state Types `id` for the world site route connectivity time state system contract.
   */
  id: string;
  /**
   * At least two finite ordered centerline points in world XZ coordinates.
   *
   * @evidence requirements/map/movement-and-visibility.md#map-route-connectivity Exposes `waypoints` as the portable data boundary for the map route connectivity requirement.
   * @evidence specifications/world-and-site/traversal-and-visibility.md#world-site-route-connectivity-time-state Types `waypoints` for the world site route connectivity time state system contract.
   */
  waypoints: Array<{
    /** World X in meters. */
    x: number;
    /** World Z in meters. */
    z: number;
  }>;
  /**
   * Finite maximum formation width in meters, strictly above zero.
   *
   * @evidence requirements/map/movement-and-visibility.md#map-route-connectivity Exposes `allowedFormationWidth` as the portable data boundary for the map route connectivity requirement.
   * @evidence specifications/world-and-site/traversal-and-visibility.md#world-site-route-connectivity-time-state Types `allowedFormationWidth` for the world site route connectivity time state system contract.
   */
  allowedFormationWidth: number;
}
