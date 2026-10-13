import type { IHumanBodySkinVoxelDistance } from "./IHumanBodySkinVoxelDistance";

/**
 * The posed skin voxelised around a garment: a regular grid of cubic cells,
 * the distance from each cell to the skin, and the queries a garment's
 * creases are closed with. The grid holds voxel centres at
 * `origin + index * cell`, `x` fastest and `z` slowest, in the metres of the
 * posed skin's frame; it is built by `voxelizeHumanBodySkin` and read by
 * `closeHumanBodyUnderwearCreases`, which owns its meaning.
 *
 * @evidence contracts/common.md#principled-implementation Grid dimensions, distance data and query signatures describe sampled garment support with separate triangle clearance qualification.
 * @evidence contracts/common.md#clear-and-simple-design The voxelization owner supplies the callable queries and the garment crease owner consumes their results.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Open-rim hits remain excluded and local exterior qualification does not claim a global sign for an open skin.
 * @evidence contracts/common.md#meaningful-documentation The comment gives index order, metres, squared voxel distances and each query's limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The garment skin voxel interface definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The garment skin voxel interface type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The garment skin voxel interface declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinVoxels {
  /** Voxels along x, y and z. */
  dimensions: [number, number, number];

  /** Side of one voxel, metres. */
  cell: number;

  /**
   * For every voxel the squared distance, in voxels, to the nearest voxel a
   * skin sample falls in, and that voxel's index (`-1` when the skin has no
   * sample in the grid).
   */
  distance: IHumanBodySkinVoxelDistance;

  /**
   * The centre of voxel `voxel`, metres.
   *
   * @evidence contracts/common.md#principled-implementation A flattened grid index maps to its posed-frame centre in metres, with x varying fastest.
   * @evidence contracts/common.md#clear-and-simple-design The voxelization owner binds the origin and grid dimensions behind this query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Grid coordinates use the declared cell size without relocating source skin.
   * @evidence contracts/common.md#meaningful-documentation The method states index input and metre-valued coordinate output.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The voxel centre signature specifies an operation but selects no implementation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The voxel centre signature declares no cache or cross-request coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The voxel centre signature acquires no resources and implements no storage lifetime.
   */
  centre(voxel: number): number[];

  /**
   * The voxel whose centre is nearest to `at`, clamped into the grid.
   *
   * @evidence contracts/common.md#principled-implementation A metre-valued point maps to the nearest grid centre, clamped to admitted grid dimensions.
   * @evidence contracts/common.md#clear-and-simple-design The inverse coordinate query belongs beside the forward centre query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Boundary clamping addresses points outside the finite grid instead of changing its origin.
   * @evidence contracts/common.md#meaningful-documentation The method documents nearest-centre rounding and boundary clamping.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The voxel lookup signature specifies an operation but selects no implementation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The voxel lookup signature declares no cache or cross-request coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The voxel lookup signature acquires no resources and implements no storage lifetime.
   */
  voxelOf(at: readonly number[]): number;

  /**
   * The skin sample nearest to `at` among those of `voxel` and its twenty-six neighbours, metres; a fresh copy of `at` when those cells hold no sample.
   *
   * @evidence contracts/common.md#principled-implementation A query reads the nearest skin sample in the selected voxel and its twenty-six neighbours; no samples return a copy of the query point.
   * @evidence contracts/common.md#clear-and-simple-design The voxelization owner retains sample buckets behind this local query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This local sampled reading does not claim the global nearest triangle.
   * @evidence contracts/common.md#meaningful-documentation The comment states the local neighbourhood, metre frame and empty-neighbourhood fallback.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The local skin sample signature specifies an operation but selects no implementation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The local skin sample signature declares no cache or cross-request coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The local skin sample signature acquires no resources and implements no storage lifetime.
   */
  nearest(voxel: number, at: readonly number[]): number[];

  /**
   * Actual nearest-triangle separation in metres, independent of voxel sites; positive infinity when the skin supplies no triangle query.
   *
   * @evidence contracts/common.md#principled-implementation The query reads actual nearest-triangle separation in metres; no triangle query yields positive infinity.
   * @evidence contracts/common.md#clear-and-simple-design Continuous triangle queries remain separate from coarse occupied voxel sites.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reading avoids substituting sampled-grid distance for geometric clearance.
   * @evidence contracts/common.md#meaningful-documentation The method distinguishes triangle distance and the empty-skin result.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The triangle clearance signature specifies an operation but selects no implementation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The triangle clearance signature declares no cache or cross-request coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The triangle clearance signature acquires no resources and implements no storage lifetime.
   */
  clearance(at: readonly number[]): number;

  /**
   * The voxels a ball of radius `rho` could rest on, one byte each: proposed by the existing sampled shell, then qualified by actual triangle clearance at least rho and an oriented interior-feature exterior side. Open-rim hits are excluded; this is not a global sign for an open volume.
   *
   * @evidence contracts/common.md#principled-implementation A byte mask proposes radius-ball centres from the sampled shell and qualifies them against actual triangle clearance and oriented interior-feature side.
   * @evidence contracts/common.md#clear-and-simple-design The query combines coarse candidates with the voxelization owner's triangle queries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Open-rim witnesses are excluded; local sheet qualification does not supply a global open-volume sign.
   * @evidence contracts/common.md#meaningful-documentation The comment states the radius criterion, byte-per-voxel result and open-rim limitation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The qualified ball centre signature specifies an operation but selects no implementation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The qualified ball centre signature declares no cache or cross-request coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The qualified ball centre signature acquires no resources and implements no storage lifetime.
   */
  centres(rho: number): Uint8Array;
}
