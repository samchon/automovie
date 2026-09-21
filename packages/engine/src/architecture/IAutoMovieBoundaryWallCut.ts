import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieWallOpening } from "../geometry/IAutoMovieWallOpening";

/**
 * The rectangular wall panel and cut voids one boundary's own face implies.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `IAutoMovieBoundaryWallCut` represents the rectangular wall panel and cut voids one boundary's own face implies. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `IAutoMovieBoundaryWallCut` structures the rectangular wall panel and cut voids one boundary's own face implies for the system that resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export interface IAutoMovieBoundaryWallCut {
  /**
   * Panel extent along the boundary's local X, in metres.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `width` records `IAutoMovieBoundaryWallCut`'s panel extent along the boundary's local X, in metres. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `width` supplies `IAutoMovieBoundaryWallCut`'s panel extent along the boundary's local X, in metres when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  width: number;
  /**
   * Panel extent along the boundary's local Y, in metres.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `height` records `IAutoMovieBoundaryWallCut`'s panel extent along the boundary's local Y, in metres. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `height` supplies `IAutoMovieBoundaryWallCut`'s panel extent along the boundary's local Y, in metres when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  height: number;
  /**
   * Panel extent along the boundary's local Z, in metres.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `depth` records `IAutoMovieBoundaryWallCut`'s panel extent along the boundary's local Z, in metres. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `depth` supplies `IAutoMovieBoundaryWallCut`'s panel extent along the boundary's local Z, in metres when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  depth: number;
  /**
   * World position of the panel's own centre.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `origin` records `IAutoMovieBoundaryWallCut`'s world position of the panel's own centre. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `origin` supplies `IAutoMovieBoundaryWallCut`'s world position of the panel's own centre when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  origin: IAutoMovieVector3;
  /**
   * World rotation of the panel, taken from the boundary's face.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `rotation` records `IAutoMovieBoundaryWallCut`'s world rotation of the panel, taken from the boundary's face. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `rotation` supplies `IAutoMovieBoundaryWallCut`'s world rotation of the panel, taken from the boundary's face when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  rotation: IAutoMovieQuaternion;
  /**
   * Kernel voids, each keyed by the architectural opening that declared it.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `openings` records `IAutoMovieBoundaryWallCut`'s kernel voids, each keyed by the architectural opening that declared it. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `openings` supplies `IAutoMovieBoundaryWallCut`'s kernel voids, each keyed by the architectural opening that declared it when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  openings: IAutoMovieWallOpening[];
}
