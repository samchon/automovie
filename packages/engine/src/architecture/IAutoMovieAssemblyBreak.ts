/**
 * One construction role that stops at a junction.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `IAutoMovieAssemblyBreak` represents one construction role that stops at a junction. This ensures adjacent regions join, overlap, or break by declared construction rules.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieAssemblyBreak` structures one construction role that stops at a junction for the system that resolves ordered construction layers into their host face regions.
 */
export interface IAutoMovieAssemblyBreak {
  /**
   * The role only one side declares.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `role` records `IAutoMovieAssemblyBreak`'s role only one side declares. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `role` supplies `IAutoMovieAssemblyBreak`'s role only one side declares when the engine resolves ordered construction layers into their host face regions.
   */
  role: string;
  /**
   * Which build-up carries it.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `side` records `IAutoMovieAssemblyBreak`'s which build-up carries it. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `side` supplies `IAutoMovieAssemblyBreak`'s which build-up carries it when the engine resolves ordered construction layers into their host face regions.
   */
  side: "left" | "right";
  /**
   * Summed thickness the carrying side gives the role, in metres.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `thickness` records `IAutoMovieAssemblyBreak`'s summed thickness the carrying side gives the role, in metres. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `thickness` supplies `IAutoMovieAssemblyBreak`'s summed thickness the carrying side gives the role, in metres when the engine resolves ordered construction layers into their host face regions.
   */
  thickness: number;
}
