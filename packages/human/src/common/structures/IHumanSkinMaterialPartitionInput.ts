import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One performed static skin region and its rest-material coverage samples.
 * Array order is the mesh's actual render order, after any source subdivision.
 *
 * @evidence contracts/common.md#principled-implementation Coverage and source references align with the actual mesh vertices so the partition reads the same material point.
 * @evidence contracts/common.md#clear-and-simple-design One named input keeps the performed mesh distinct from rest-material coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native correspondence is supplied by source owners rather than reconstructed from coordinate proximity.
 * @evidence contracts/common.md#meaningful-documentation Documents alignment, performed ownership and the field's sign.
 * @author Samchon
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The final composition defines parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries an evaluated field without defining controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The partition computation emits meshes.
 * @evidence contracts/modeling.md#spatial-conventions Performed metre coordinates and rest coverage are retained in their declared source frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The partition calculation owns crossing construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source owners admit geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping input.
 */
export interface IHumanSkinMaterialPartitionInput {
  /** Performed mesh, with source UV and physical aliases retained. */
  mesh: IAutoMovieMesh;

  /** Finite coverage per render vertex; positive denotes clothing. */
  field: readonly number[];

  /** Source or actual appended-stencil ordinals aligned with render vertices. */
  sources: readonly number[];
}
