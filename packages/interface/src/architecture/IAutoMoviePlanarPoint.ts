/**
 * One point in a boundary's own local XY plane, measured in metres.
 *
 * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-shared-boundary-identity Exposes `IAutoMoviePlanarPoint` as the portable data boundary for the building shared boundary identity requirement.
 * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-shared-boundary-identity Types `IAutoMoviePlanarPoint` for the building envelope coordinate shared boundary identity system contract.
 */
export interface IAutoMoviePlanarPoint {
  /**
   * Coordinate along the host frame's local X axis.
   *
   * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-shared-boundary-identity Exposes `x` as the portable data boundary for the building shared boundary identity requirement.
   * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-shared-boundary-identity Types `x` for the building envelope coordinate shared boundary identity system contract.
   */
  x: number;

  /**
   * Coordinate along the host frame's local Y axis.
   *
   * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-shared-boundary-identity Exposes `y` as the portable data boundary for the building shared boundary identity requirement.
   * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-shared-boundary-identity Types `y` for the building envelope coordinate shared boundary identity system contract.
   */
  y: number;
}
