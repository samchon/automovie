import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One performed static skin region and its rest-material coverage samples.
 * Array order is the mesh's actual render order, after any source subdivision.
 *
 * @author Samchon
 */
export interface IHumanSkinMaterialPartitionInput {
  /** Performed mesh, with source UV and physical aliases retained. */
  mesh: IAutoMovieMesh;

  /** Finite coverage per render vertex; positive denotes clothing. */
  field: readonly number[];

  /** Source or actual appended-stencil ordinals aligned with render vertices. */
  sources: readonly number[];
}
