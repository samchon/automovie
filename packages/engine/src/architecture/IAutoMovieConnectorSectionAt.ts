/**
 * The usable section of a connector at one point of its route.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `IAutoMovieConnectorSectionAt` represents the usable section of a connector at one point of its route. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `IAutoMovieConnectorSectionAt` structures the usable section of a connector at one point of its route for the system that resolves ownership, topology, and geometry inside one building-interior boundary.
 */
export interface IAutoMovieConnectorSectionAt {
  /**
   * Usable width in metres.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `width` records `IAutoMovieConnectorSectionAt`'s usable width in metres. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `width` supplies `IAutoMovieConnectorSectionAt`'s usable width in metres when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  width: number;
  /**
   * Vertical clearance in metres.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `clearHeight` records `IAutoMovieConnectorSectionAt`'s vertical clearance in metres. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `clearHeight` supplies `IAutoMovieConnectorSectionAt`'s vertical clearance in metres when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
   */
  clearHeight: number;
}
