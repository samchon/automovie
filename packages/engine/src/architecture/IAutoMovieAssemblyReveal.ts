/**
 * What a build-up does to an opening cut through its host.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `IAutoMovieAssemblyReveal` defines what a build-up does to an opening cut through its host. This ensures opening and section cuts expose the actual hidden build-up.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieAssemblyReveal` structures what a build-up does to an opening cut through its host for the system that resolves ordered construction layers into their host face regions.
 */
export interface IAutoMovieAssemblyReveal {
  /**
   * Finished clear width in metres once the lining runs reach the jamb.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `width` records `IAutoMovieAssemblyReveal`'s finished clear width in metres once the lining runs reach the jamb. This ensures opening and section cuts expose the actual hidden build-up.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `width` supplies `IAutoMovieAssemblyReveal`'s finished clear width in metres once the lining runs reach the jamb when the engine resolves ordered construction layers into their host face regions.
   */
  width: number;
  /**
   * Finished clear height in metres.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `height` records `IAutoMovieAssemblyReveal`'s finished clear height in metres. This ensures opening and section cuts expose the actual hidden build-up.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `height` supplies `IAutoMovieAssemblyReveal`'s finished clear height in metres when the engine resolves ordered construction layers into their host face regions.
   */
  height: number;
  /**
   * Lining thickness taken off each side of the opening, in metres.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `inset` records `IAutoMovieAssemblyReveal`'s lining thickness taken off each side of the opening, in metres. This ensures opening and section cuts expose the actual hidden build-up.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `inset` supplies `IAutoMovieAssemblyReveal`'s lining thickness taken off each side of the opening, in metres when the engine resolves ordered construction layers into their host face regions.
   */
  inset: number;
  /**
   * Lining depth measured inward from the first face, in metres.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `first` records `IAutoMovieAssemblyReveal`'s lining depth measured inward from the first face, in metres. This ensures opening and section cuts expose the actual hidden build-up.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `first` supplies `IAutoMovieAssemblyReveal`'s lining depth measured inward from the first face, in metres when the engine resolves ordered construction layers into their host face regions.
   */
  first: number;
  /**
   * Lining depth measured inward from the last face, in metres.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `last` records `IAutoMovieAssemblyReveal`'s lining depth measured inward from the last face, in metres. This ensures opening and section cuts expose the actual hidden build-up.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `last` supplies `IAutoMovieAssemblyReveal`'s lining depth measured inward from the last face, in metres when the engine resolves ordered construction layers into their host face regions.
   */
  last: number;
  /**
   * Jamb depth left bare between the two linings, in metres.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `bare` records `IAutoMovieAssemblyReveal`'s jamb depth left bare between the two linings, in metres. This ensures opening and section cuts expose the actual hidden build-up.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `bare` supplies `IAutoMovieAssemblyReveal`'s jamb depth left bare between the two linings, in metres when the engine resolves ordered construction layers into their host face regions.
   */
  bare: number;
  /**
   * Ids of the layers that line the jamb, in stack order.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-hidden-layers-cut-faces `layers` records `IAutoMovieAssemblyReveal`'s ids of the layers that line the jamb, in stack order. This ensures opening and section cuts expose the actual hidden build-up.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `layers` supplies `IAutoMovieAssemblyReveal`'s ids of the layers that line the jamb, in stack order when the engine resolves ordered construction layers into their host face regions.
   */
  layers: string[];
}
