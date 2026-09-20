import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one movable panel stands, in world space, at one operating state.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `IAutoMovieOpeningPanelPlacement` defines where one movable panel stands, in world space, at one operating state. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `IAutoMovieOpeningPanelPlacement` structures where one movable panel stands, in world space, at one operating state for the system that resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export interface IAutoMovieOpeningPanelPlacement {
  /**
   * Panel id inside its opening.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `panel` records `IAutoMovieOpeningPanelPlacement`'s panel id inside its opening. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `panel` supplies `IAutoMovieOpeningPanelPlacement`'s panel id inside its opening when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  panel: string;
  /**
   * The visible element the panel drives.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `element` records `IAutoMovieOpeningPanelPlacement`'s visible element the panel drives. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `element` supplies `IAutoMovieOpeningPanelPlacement`'s visible element the panel drives when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  element: string;
  /**
   * The staged node id {@link lowerBuiltEnvironment} emits for that element.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `node` records `IAutoMovieOpeningPanelPlacement`'s staged node id `lowerBuiltEnvironment` emits for that element. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `node` supplies `IAutoMovieOpeningPanelPlacement`'s staged node id `lowerBuiltEnvironment` emits for that element when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  node: string;
  /**
   * World translation of the panel's element.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `position` records `IAutoMovieOpeningPanelPlacement`'s world translation of the panel's element. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `position` supplies `IAutoMovieOpeningPanelPlacement`'s world translation of the panel's element when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  position: IAutoMovieVector3;
  /**
   * World rotation of the panel's element, as a unit quaternion.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `rotation` records `IAutoMovieOpeningPanelPlacement`'s world rotation of the panel's element, as a unit quaternion. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `rotation` supplies `IAutoMovieOpeningPanelPlacement`'s world rotation of the panel's element, as a unit quaternion when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  rotation: IAutoMovieQuaternion;
  /**
   * World per-axis scale of the panel's element.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `scale` records `IAutoMovieOpeningPanelPlacement`'s world per-axis scale of the panel's element. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `scale` supplies `IAutoMovieOpeningPanelPlacement`'s world per-axis scale of the panel's element when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  scale: IAutoMovieVector3;
}
