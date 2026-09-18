import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world volume one movable panel sweeps across its whole travel.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `IAutoMovieOpeningSweep` represents the world volume one movable panel sweeps across its whole travel. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `IAutoMovieOpeningSweep` structures the world volume one movable panel sweeps across its whole travel for the system that resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export interface IAutoMovieOpeningSweep {
  /**
   * Panel id inside its opening.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `panel` records `IAutoMovieOpeningSweep`'s panel id inside its opening. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `panel` supplies `IAutoMovieOpeningSweep`'s panel id inside its opening when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  panel: string;
  /**
   * The visible element the panel drives.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `element` records `IAutoMovieOpeningSweep`'s visible element the panel drives. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `element` supplies `IAutoMovieOpeningSweep`'s visible element the panel drives when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  element: string;
  /**
   * World minimum corner of the swept volume.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `min` records `IAutoMovieOpeningSweep`'s world minimum corner of the swept volume. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `min` supplies `IAutoMovieOpeningSweep`'s world minimum corner of the swept volume when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  min: IAutoMovieVector3;
  /**
   * World maximum corner of the swept volume.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `max` records `IAutoMovieOpeningSweep`'s world maximum corner of the swept volume. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `max` supplies `IAutoMovieOpeningSweep`'s world maximum corner of the swept volume when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  max: IAutoMovieVector3;
}
