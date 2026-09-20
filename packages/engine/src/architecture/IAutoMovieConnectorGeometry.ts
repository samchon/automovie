import { IAutoMovieConnectorLandingAt } from "./IAutoMovieConnectorLandingAt";
import { IAutoMovieConnectorStation } from "./IAutoMovieConnectorStation";

/**
 * The measured traversal shape of one connector.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `IAutoMovieConnectorGeometry` represents the measured traversal shape of one connector. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `IAutoMovieConnectorGeometry` structures the measured traversal shape of one connector for the system that resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export interface IAutoMovieConnectorGeometry {
  /**
   * Signed climb from the first station to the last, in metres.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `rise` records `IAutoMovieConnectorGeometry`'s signed climb from the first station to the last, in metres. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `rise` supplies `IAutoMovieConnectorGeometry`'s signed climb from the first station to the last, in metres when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  rise: number;
  /**
   * Horizontal length of the route polyline, in metres.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `run` records `IAutoMovieConnectorGeometry`'s horizontal length of the route polyline, in metres. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `run` supplies `IAutoMovieConnectorGeometry`'s horizontal length of the route polyline, in metres when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  run: number;
  /**
   * Total 3D length of the route polyline, in metres.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `length` records `IAutoMovieConnectorGeometry`'s total 3D length of the route polyline, in metres. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `length` supplies `IAutoMovieConnectorGeometry`'s total 3D length of the route polyline, in metres when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  length: number;
  /**
   * Slope of the run from horizontal, in radians within `[0, PI / 2]`.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `slope` records `IAutoMovieConnectorGeometry`'s slope of the run from horizontal, in radians within `[0, PI / 2]`. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `slope` supplies `IAutoMovieConnectorGeometry`'s slope of the run from horizontal, in radians within `[0, PI / 2]` when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  slope: number;
  /**
   * The route's own stations, in authored order.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `stations` records `IAutoMovieConnectorGeometry`'s route's own stations, in authored order. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `stations` supplies `IAutoMovieConnectorGeometry`'s route's own stations, in authored order when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  stations: IAutoMovieConnectorStation[];
  /**
   * The further spaces the run stops at, placed on its own route.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `landings` records `IAutoMovieConnectorGeometry`'s further spaces the run stops at, placed on its own route. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `landings` supplies `IAutoMovieConnectorGeometry`'s further spaces the run stops at, placed on its own route when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  landings: IAutoMovieConnectorLandingAt[];
}
