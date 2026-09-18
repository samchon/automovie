import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one carriage of a run stands, in world space, at one state.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `IAutoMovieConnectorCarriagePlacement` defines where one carriage of a run stands, in world space, at one state. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `IAutoMovieConnectorCarriagePlacement` structures where one carriage of a run stands, in world space, at one state for the system that resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export interface IAutoMovieConnectorCarriagePlacement {
  /**
   * Carriage id inside its connector.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `carriage` records `IAutoMovieConnectorCarriagePlacement`'s carriage id inside its connector. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `carriage` supplies `IAutoMovieConnectorCarriagePlacement`'s carriage id inside its connector when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  carriage: string;
  /**
   * The visible element the carriage drives.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `element` records `IAutoMovieConnectorCarriagePlacement`'s visible element the carriage drives. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `element` supplies `IAutoMovieConnectorCarriagePlacement`'s visible element the carriage drives when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  element: string;
  /**
   * The staged node id {@link lowerBuiltEnvironment} emits for that element.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `node` records `IAutoMovieConnectorCarriagePlacement`'s staged node id `lowerBuiltEnvironment` emits for that element. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `node` supplies `IAutoMovieConnectorCarriagePlacement`'s staged node id `lowerBuiltEnvironment` emits for that element when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  node: string;
  /**
   * World translation of the carriage's element.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `position` records `IAutoMovieConnectorCarriagePlacement`'s world translation of the carriage's element. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `position` supplies `IAutoMovieConnectorCarriagePlacement`'s world translation of the carriage's element when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  position: IAutoMovieVector3;
  /**
   * World rotation of the carriage's element, as a unit quaternion.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `rotation` records `IAutoMovieConnectorCarriagePlacement`'s world rotation of the carriage's element, as a unit quaternion. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `rotation` supplies `IAutoMovieConnectorCarriagePlacement`'s world rotation of the carriage's element, as a unit quaternion when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  rotation: IAutoMovieQuaternion;
  /**
   * World per-axis scale of the carriage's element.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `scale` records `IAutoMovieConnectorCarriagePlacement`'s world per-axis scale of the carriage's element. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `scale` supplies `IAutoMovieConnectorCarriagePlacement`'s world per-axis scale of the carriage's element when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  scale: IAutoMovieVector3;
  /**
   * Logical space this carriage stands at in that state, or null.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `serves` records `IAutoMovieConnectorCarriagePlacement`'s logical space this carriage stands at in that state, or null. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `serves` supplies `IAutoMovieConnectorCarriagePlacement`'s logical space this carriage stands at in that state, or null when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  serves: string | null;
}
