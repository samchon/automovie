import type { IAutoMovieHumanBodySkinVoxels } from "../structures/IAutoMovieHumanBodySkinVoxels";

/**
 * Native triangle clearance and original material samples of one component.
 *
 * @evidence contracts/common.md#principled-implementation Native posed-triangle clearance, original sample positions/normals and meter ball radius define qualified envelope centers without changing material correspondence.
 * @evidence contracts/common.md#clear-and-simple-design One component input shares the existing voxel query with its own material samples and outward directions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Qualification uses actual skin triangles and exact original samples, not snapped centers or synthetic skin closure.
 * @evidence contracts/common.md#meaningful-documentation Members identify native query ownership, common posed meter frame, outward directions and existing radius.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Envelope-input typing computes no center mask, free-ball admission or spatial hierarchy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared voxel dependency names reuse already owned by the component's envelope creator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed envelope inputs acquire no center population or nearest-query closure.
 * @author Samchon
 */
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
