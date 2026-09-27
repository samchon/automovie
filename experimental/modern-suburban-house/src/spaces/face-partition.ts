/**
 * Split one already-authored static solid at a planar exterior face.
 *
 * The calling structural owner keeps the body triangles; the calling finish
 * owner receives exactly the selected face triangles. This partitions one
 * mesh's existing positions, normals, UVs and vertex colours without adding
 * or moving a triangle. Both callers use the same source mesh and world-plane
 * coordinate, so the assembled surface is unchanged. The outputs are open at
 * this named ownership interface and are not independent closed solids.
 */
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Partition triangles lying wholly on one world-axis plane.
 * @evidence spaces/03-surface-owners.md The structural and room owners can receive disjoint triangles of one already-authored surface boundary.
 * @evidenceReview spaces/03-surface-owners.md #9596716 `partitionPlaneFace` places each input triangle in exactly one output mesh; its callers in `garage.ts`, `floors/ground.ts`, and their room files assign those distinct pieces to the surface owners in the table.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The room finish is selected from the shared solid without overlapping its support face.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f The plane test selects only complete coplanar triangles for the room's face result; all other triangles remain in `body`, so the callers cannot duplicate the same exposed floor or riser triangle.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller supplies the mesh and world plane; this helper chooses no house surface owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This function receives an `IAutoMovieMesh`, axis and plane, and returns anonymous meshes; owner, role, color, and part id are supplied later by each calling source file.
 * @evidence principles/core/source-units.md#source-substantive-completion The result carries every source triangle and aligned attribute exactly once in a face or body mesh.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The triangle loop copies all positions and available normals, UVs, and colors by each source index into one result; malformed or one-sided meshes throw before a caller can emit an incomplete handoff.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed surface handoff already assigns support and finish faces to their respective source files; this helper only separates their triangle buffers.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `03-surface-owners` already distinguishes structural support from room finish; this utility applies a supplied plane to that existing boundary and introduces no new opening, level, or owner decision.
 */
export const partitionPlaneFace = (
  mesh: IAutoMovieMesh,
  axis: "x" | "y" | "z",
  plane: number,
): { face: IAutoMovieMesh; body: IAutoMovieMesh } => {
  if (mesh.skin !== null) throw new Error("A space surface face cannot carry skin data.");
  const offset = { x: 0, y: 1, z: 2 }[axis];
  const indices = mesh.indices ?? Array.from({ length: mesh.positions.length / 3 }, (_, i) => i);
  if (indices.length % 3 !== 0) throw new Error("A space surface needs complete triangles.");
  const empty = (): IAutoMovieMesh => ({
    positions: [],
    normals: mesh.normals === null ? null : [],
    uvs: mesh.uvs === null ? null : [],
    ...(mesh.colors === undefined ? {} : { colors: [] }),
    indices: null,
    skin: null,
  });
  const face = empty();
  const body = empty();
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = indices.slice(i, i + 3);
    if (triangle.some((id) => !Number.isInteger(id) || id < 0 || id >= mesh.positions.length / 3))
      throw new Error("A space surface triangle has an invalid vertex index.");
    const target = triangle.every((id) => Math.abs(mesh.positions[3 * id + offset]! - plane) <= 1e-6)
      ? face
      : body;
    for (const id of triangle) {
      target.positions.push(...mesh.positions.slice(3 * id, 3 * id + 3));
      if (target.normals !== null && mesh.normals !== null)
        target.normals.push(...mesh.normals.slice(3 * id, 3 * id + 3));
      if (target.uvs !== null && mesh.uvs !== null)
        target.uvs.push(...mesh.uvs.slice(2 * id, 2 * id + 2));
      if (target.colors !== undefined && mesh.colors !== undefined)
        target.colors.push(...mesh.colors.slice(3 * id, 3 * id + 3));
    }
  }
  if (face.positions.length === 0 || body.positions.length === 0)
    throw new Error(`A space surface needs both face and body triangles at ${axis}=${plane}.`);
  return { face, body };
};
