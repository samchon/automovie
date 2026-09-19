import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One oriented station of a connector's route.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `IAutoMovieConnectorStation` represents one oriented station of a connector's route. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `IAutoMovieConnectorStation` structures one oriented station of a connector's route for the system that resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export interface IAutoMovieConnectorStation {
  /**
   * World position of the station.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `position` records `IAutoMovieConnectorStation`'s world position of the station. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `position` supplies `IAutoMovieConnectorStation`'s world position of the station when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  position: IAutoMovieVector3;
  /**
   * Authored facing, or null when the connector declared none.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `rotation` records `IAutoMovieConnectorStation`'s authored facing, or null when the connector declared none. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `rotation` supplies `IAutoMovieConnectorStation`'s authored facing, or null when the connector declared none when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  rotation: IAutoMovieQuaternion | null;
  /**
   * Arc-length fraction of the station along the route, in `[0, 1]`.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `at` records `IAutoMovieConnectorStation`'s arc-length fraction of the station along the route, in `[0, 1]`. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `at` supplies `IAutoMovieConnectorStation`'s arc-length fraction of the station along the route, in `[0, 1]` when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  at: number;
}
