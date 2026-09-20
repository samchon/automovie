import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One further space a run stops at, placed on the route that reaches it.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `IAutoMovieConnectorLandingAt` represents one further space a run stops at, placed on the route that reaches it. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `IAutoMovieConnectorLandingAt` structures one further space a run stops at, placed on the route that reaches it for the system that resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export interface IAutoMovieConnectorLandingAt {
  /**
   * Logical space served at this stop.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `space` records `IAutoMovieConnectorLandingAt`'s logical space served at this stop. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `space` supplies `IAutoMovieConnectorLandingAt`'s logical space served at this stop when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  space: string;
  /**
   * Arc-length fraction of the route, as authored.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `at` records `IAutoMovieConnectorLandingAt`'s arc-length fraction of the route, as authored. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `at` supplies `IAutoMovieConnectorLandingAt`'s arc-length fraction of the route, as authored when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  at: number;
  /**
   * World position of that point of the route.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `position` records `IAutoMovieConnectorLandingAt`'s world position of that point of the route. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `position` supplies `IAutoMovieConnectorLandingAt`'s world position of that point of the route when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  position: IAutoMovieVector3;
}
