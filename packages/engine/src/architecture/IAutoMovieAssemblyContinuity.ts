/**
 * One construction role carried through a junction by both build-ups.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `IAutoMovieAssemblyContinuity` represents one construction role carried through a junction by both build-ups. This ensures adjacent regions join, overlap, or break by declared construction rules.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieAssemblyContinuity` structures one construction role carried through a junction by both build-ups for the system that resolves ordered construction layers into their host face regions.
 */
export interface IAutoMovieAssemblyContinuity {
  /**
   * The role both sides declare.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `role` records `IAutoMovieAssemblyContinuity`'s role both sides declare. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `role` supplies `IAutoMovieAssemblyContinuity`'s role both sides declare when the engine resolves ordered construction layers into their host face regions.
   */
  role: string;
  /**
   * Signed span the role occupies on the left build-up.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `left` records `IAutoMovieAssemblyContinuity`'s signed span the role occupies on the left build-up. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `left` supplies `IAutoMovieAssemblyContinuity`'s signed span the role occupies on the left build-up when the engine resolves ordered construction layers into their host face regions.
   */
  left: {
    /** Lowest signed coordinate. */
    min: number;
    /** Highest signed coordinate. */
    max: number;
  };
  /**
   * Signed span the role occupies on the right build-up.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `right` records `IAutoMovieAssemblyContinuity`'s signed span the role occupies on the right build-up. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `right` supplies `IAutoMovieAssemblyContinuity`'s signed span the role occupies on the right build-up when the engine resolves ordered construction layers into their host face regions.
   */
  right: {
    /** Lowest signed coordinate. */
    min: number;
    /** Highest signed coordinate. */
    max: number;
  };
  /**
   * Shared signed length in metres; negative states the gap between spans.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `overlap` records `IAutoMovieAssemblyContinuity`'s shared signed length in metres; negative states the gap between spans. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `overlap` supplies `IAutoMovieAssemblyContinuity`'s shared signed length in metres; negative states the gap between spans when the engine resolves ordered construction layers into their host face regions.
   */
  overlap: number;
  /**
   * Whether the two spans meet or overlap within the caller's tolerance.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `aligned` records whether the two spans meet or overlap within the caller's tolerance for `IAutoMovieAssemblyContinuity`. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `aligned` tells the engine whether the two spans meet or overlap within the caller's tolerance for `IAutoMovieAssemblyContinuity` as it resolves ordered construction layers into their host face regions.
   */
  aligned: boolean;
}
