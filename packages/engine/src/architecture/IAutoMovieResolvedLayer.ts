import { IAutoMovieMaterialLayer } from "@automovie/interface";

/**
 * One layer placed on the host's own measuring line.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `IAutoMovieResolvedLayer` represents one layer placed on the host's own measuring line. This ensures each host region retains its ordered construction build-up and total thickness.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieResolvedLayer` structures one layer placed on the host's own measuring line for the system that resolves ordered construction layers into their host face regions.
 */
export interface IAutoMovieResolvedLayer {
  /**
   * The contributing {@link IAutoMovieMaterialLayer.id}.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `id` records `IAutoMovieResolvedLayer`'s contributing `IAutoMovieMaterialLayer.id`. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `id` supplies `IAutoMovieResolvedLayer`'s contributing `IAutoMovieMaterialLayer.id` when the engine resolves ordered construction layers into their host face regions.
   */
  id: string;
  /**
   * The layer's construction role.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `role` records `IAutoMovieResolvedLayer`'s layer's construction role. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `role` supplies `IAutoMovieResolvedLayer`'s layer's construction role when the engine resolves ordered construction layers into their host face regions.
   */
  role: string;
  /**
   * What occupies the layer.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `substance` records what occupies the layer for `IAutoMovieResolvedLayer`. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `substance` tells the engine what occupies the layer for `IAutoMovieResolvedLayer` as it resolves ordered construction layers into their host face regions.
   */
  substance: "solid" | "cavity" | "membrane";
  /**
   * Substance id, or `null` for a cavity.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `material` records `IAutoMovieResolvedLayer`'s substance id, or `null` for a cavity. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `material` supplies `IAutoMovieResolvedLayer`'s substance id, or `null` for a cavity when the engine resolves ordered construction layers into their host face regions.
   */
  material: string | null;
  /**
   * Authored layer thickness in metres.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `thickness` records `IAutoMovieResolvedLayer`'s authored layer thickness in metres. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `thickness` supplies `IAutoMovieResolvedLayer`'s authored layer thickness in metres when the engine resolves ordered construction layers into their host face regions.
   */
  thickness: number;
  /**
   * Signed coordinate of the face nearer the reference plane.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `start` records `IAutoMovieResolvedLayer`'s signed coordinate of the face nearer the reference plane. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `start` supplies `IAutoMovieResolvedLayer`'s signed coordinate of the face nearer the reference plane when the engine resolves ordered construction layers into their host face regions.
   */
  start: number;
  /**
   * Signed coordinate of the face further from the reference plane.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `end` records `IAutoMovieResolvedLayer`'s signed coordinate of the face further from the reference plane. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `end` supplies `IAutoMovieResolvedLayer`'s signed coordinate of the face further from the reference plane when the engine resolves ordered construction layers into their host face regions.
   */
  end: number;
  /**
   * Signed coordinate of the layer's midplane.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `center` records `IAutoMovieResolvedLayer`'s signed coordinate of the layer's midplane. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `center` supplies `IAutoMovieResolvedLayer`'s signed coordinate of the layer's midplane when the engine resolves ordered construction layers into their host face regions.
   */
  center: number;
  /**
   * Whether the layer is a visible finish.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `finish` records whether the layer is a visible finish for `IAutoMovieResolvedLayer`. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `finish` tells the engine whether the layer is a visible finish for `IAutoMovieResolvedLayer` as it resolves ordered construction layers into their host face regions.
   */
  finish: boolean;
  /**
   * Whether the layer continues around an opening's reveal.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `wrapsOpening` records whether the layer continues around an opening's reveal for `IAutoMovieResolvedLayer`. This ensures each host region retains its ordered construction build-up and total thickness.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `wrapsOpening` tells the engine whether the layer continues around an opening's reveal for `IAutoMovieResolvedLayer` as it resolves ordered construction layers into their host face regions.
   */
  wrapsOpening: boolean;
}
