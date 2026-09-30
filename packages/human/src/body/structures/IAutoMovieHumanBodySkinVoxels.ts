/**
 * The posed skin voxelised around a garment: a regular grid of cubic cells,
 * the distance from each cell to the skin, and the queries a garment's
 * creases are closed with. The grid holds voxel centres at
 * `origin + index * cell`, `x` fastest and `z` slowest, in the metres of the
 * posed skin's frame; it is built by `voxelizeHumanBodySkin` and read by
 * `closeHumanBodyUnderwearCreases`, which owns its meaning.
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
  distance: { squared: Float64Array; source: Int32Array };

  /** The centre of voxel `voxel`, metres. */
  centre(voxel: number): number[];

  /** The voxel whose centre is nearest to `at`, clamped into the grid. */
  voxelOf(at: readonly number[]): number;

  /**
   * The skin sample nearest to `at` among those of `voxel` and its
   * twenty-six neighbours, metres.
   */
  nearest(voxel: number, at: readonly number[]): number[];

  /**
   * The voxels a ball of radius `rho` could rest on, one byte each: clear of
   * the skin by the radius less a cell and no more than two cells beyond, and
   * in the air and not in the flesh.
   */
  centres(rho: number): Uint8Array;
}
