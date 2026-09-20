/**
 * The host dimension a build-up is measured against.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `IAutoMovieAssemblyHost` represents the host dimension a build-up is measured against. This ensures each host region retains its ordered construction build-up and total thickness.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieAssemblyHost` structures the host dimension a build-up is measured against for the system that resolves ordered construction layers into their host face regions.
 */
export interface IAutoMovieAssemblyHost {
  /**
   * Nominal host thickness along the assembly's stacking axis, in metres.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `thickness` records `IAutoMovieAssemblyHost`'s nominal host thickness along the assembly's stacking axis, in metres. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `thickness` supplies `IAutoMovieAssemblyHost`'s nominal host thickness along the assembly's stacking axis, in metres when the engine resolves ordered construction layers into their host face regions.
   */
  thickness: number;
}
