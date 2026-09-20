import { IAutoMovieResolvedLayer } from "./IAutoMovieResolvedLayer";

/**
 * A build-up placed on a signed measuring line, ready to be dimensioned.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `IAutoMovieResolvedAssembly` represents a build-up placed on a signed measuring line, ready to be dimensioned. This ensures each host region retains its ordered construction build-up and total thickness.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieResolvedAssembly` structures a build-up placed on a signed measuring line, ready to be dimensioned for the system that resolves ordered construction layers into their host face regions.
 */
export interface IAutoMovieResolvedAssembly {
  /**
   * The contributing {@link IAutoMovieMaterialAssembly.id}.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `id` records `IAutoMovieResolvedAssembly`'s contributing `IAutoMovieMaterialAssembly.id`. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `id` supplies `IAutoMovieResolvedAssembly`'s contributing `IAutoMovieMaterialAssembly.id` when the engine resolves ordered construction layers into their host face regions.
   */
  id: string;
  /**
   * Host-local axis the layers stack along.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `axis` records `IAutoMovieResolvedAssembly`'s host-local axis the layers stack along. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `axis` supplies `IAutoMovieResolvedAssembly`'s host-local axis the layers stack along when the engine resolves ordered construction layers into their host face regions.
   */
  axis: "x" | "y" | "z";
  /**
   * Summed layer thickness in metres: the build-up's overall dimension.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `total` records `IAutoMovieResolvedAssembly`'s summed layer thickness in metres: the build-up's overall dimension. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `total` supplies `IAutoMovieResolvedAssembly`'s summed layer thickness in metres: the build-up's overall dimension when the engine resolves ordered construction layers into their host face regions.
   */
  total: number;
  /**
   * Signed coordinate of the first layer's outer face.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `start` records `IAutoMovieResolvedAssembly`'s signed coordinate of the first layer's outer face. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `start` supplies `IAutoMovieResolvedAssembly`'s signed coordinate of the first layer's outer face when the engine resolves ordered construction layers into their host face regions.
   */
  start: number;
  /**
   * Signed coordinate of the last layer's outer face.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `end` records `IAutoMovieResolvedAssembly`'s signed coordinate of the last layer's outer face. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `end` supplies `IAutoMovieResolvedAssembly`'s signed coordinate of the last layer's outer face when the engine resolves ordered construction layers into their host face regions.
   */
  end: number;
  /**
   * Ordered signed span of the whole build-up, lowest coordinate first.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `extent` records `IAutoMovieResolvedAssembly`'s ordered signed span of the whole build-up, lowest coordinate first. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `extent` supplies `IAutoMovieResolvedAssembly`'s ordered signed span of the whole build-up, lowest coordinate first when the engine resolves ordered construction layers into their host face regions.
   */
  extent: {
    /** Lowest signed coordinate the build-up occupies. */
    min: number;
    /** Highest signed coordinate the build-up occupies. */
    max: number;
  };
  /**
   * Layers in authored order, each placed on the measuring line.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `layers` records `IAutoMovieResolvedAssembly`'s layers in authored order, each placed on the measuring line. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `layers` supplies `IAutoMovieResolvedAssembly`'s layers in authored order, each placed on the measuring line when the engine resolves ordered construction layers into their host face regions.
   */
  layers: IAutoMovieResolvedLayer[];
}
