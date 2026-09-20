import { IAutoMovieAssemblyBreak } from "./IAutoMovieAssemblyBreak";
import { IAutoMovieAssemblyContinuity } from "./IAutoMovieAssemblyContinuity";

/**
 * What survives a junction between two build-ups and what stops there.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `IAutoMovieAssemblyJunction` defines what survives a junction between two build-ups and what stops there. This ensures adjacent regions join, overlap, or break by declared construction rules.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieAssemblyJunction` structures what survives a junction between two build-ups and what stops there for the system that resolves ordered construction layers into their host face regions.
 */
export interface IAutoMovieAssemblyJunction {
  /**
   * Roles both sides carry, in the left build-up's declaration order.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `continuous` records `IAutoMovieAssemblyJunction`'s roles both sides carry, in the left build-up's declaration order. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `continuous` supplies `IAutoMovieAssemblyJunction`'s roles both sides carry, in the left build-up's declaration order when the engine resolves ordered construction layers into their host face regions.
   */
  continuous: IAutoMovieAssemblyContinuity[];
  /**
   * Roles only one side carries, left-hand ones first.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `broken` records `IAutoMovieAssemblyJunction`'s roles only one side carries, left-hand ones first. This ensures adjacent regions join, overlap, or break by declared construction rules.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `broken` supplies `IAutoMovieAssemblyJunction`'s roles only one side carries, left-hand ones first when the engine resolves ordered construction layers into their host face regions.
   */
  broken: IAutoMovieAssemblyBreak[];
}
