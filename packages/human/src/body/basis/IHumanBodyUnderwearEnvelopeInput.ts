import type { IAutoMovieHumanBodySkinVoxels } from "../structures/IAutoMovieHumanBodySkinVoxels";

/** Native triangle clearance and original material samples of one component. */
export interface IHumanBodyUnderwearEnvelopeInput {
  /** Existing bounded query of actual posed reference triangles. */
  voxels: IAutoMovieHumanBodySkinVoxels;

  /** Original component XYZ material samples in the same posed metre frame. */
  points: readonly number[];

  /** Supplied outward directions used to qualify each sample's own ball. */
  normals: readonly number[];

  /** Existing garment ball radius, metres. */
  rho: number;
}
