import { AutoMoviePrimitiveShape, IAutoMovieMesh } from "@automovie/interface";

import { ITessellation } from "./ITessellation";
import { tessellate } from "./tessellate";

/**
 * Tessellate a primitive and wrap it as a complete {@link IAutoMovieMesh}.
 *
 * The mesh is indexed, carries the primitive's own normals, and has no UVs and
 * no skin, because a primitive states no atlas and rides its part's bone as a
 * rigid whole. Callers use it where a mesh is required, such as placing a
 * primitive with {@link transformAutoMovieMesh} or merging it with authored
 * parts.
 *
 * @param shape Primitive to tessellate.
 * @returns A new mesh whose arrays are owned by the caller.
 * @throws Error when `shape.type` is not a known primitive.
 *
 * @evidence contracts/common.md#principled-implementation A field-for-field lift of the tessellation into the mesh record: positions, normals and indices pass through unchanged and the two attributes a primitive does not define are `null`, so geometry and winding are exactly `tessellate`'s.
 * @evidence contracts/common.md#clear-and-simple-design A thin adapter kept separate from `tessellate` because most callers want the leaner always-indexed `ITessellation`, while placement and merge operate on `IAutoMovieMesh`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No placeholder UVs or identity skin are invented to fill the record; absence is stated with `null`.
 * @evidence contracts/common.md#meaningful-documentation States what the mesh carries and why UVs and skin are absent, where it is used, the ownership of the result and the refusal.
 * @evidence contracts/performance.md#efficient-algorithms Constant work over `tessellate`'s fixed-size output: the arrays are handed over, not copied.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callers may mutate the returned arrays, so each call returns fresh ones and nothing is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the three arrays from `tessellate` are transferred to the returned mesh.
 */
export const tessellateToMesh = (
  shape: AutoMoviePrimitiveShape,
): IAutoMovieMesh => {
  const tessellation: ITessellation = tessellate(shape);
  return {
    positions: tessellation.positions,
    normals: tessellation.normals,
    uvs: null,
    indices: tessellation.indices,
    skin: null,
  };
};
