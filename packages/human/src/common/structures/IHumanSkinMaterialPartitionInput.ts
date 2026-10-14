import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One performed static skin region and its rest-material coverage samples.
 * Array order is the mesh's actual render order, after any source subdivision.
 *
 *
 * @evidence contracts/common.md#principled-implementation Finite per-render-vertex coverage and source/stencil ordinals align with the same performed mesh after actual source subdivision.
 * @evidence contracts/common.md#clear-and-simple-design Geometry, coverage field and source indices remain separate inputs to partitionHumanSkinMaterial's actual contour interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive field values name clothing coverage without replacing source UVs, physical aliases or the mesh's render order.
 * @evidence contracts/common.md#meaningful-documentation Members state performed geometry, positive coverage meaning and actual source or appended-stencil ordinal ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Performed skin coverage input is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Performed skin coverage input specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Performed skin coverage input acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
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
