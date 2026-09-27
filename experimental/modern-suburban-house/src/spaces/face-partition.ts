/**
 * Split one already-authored static solid at a planar exterior face.
 *
 * The calling structural owner keeps the body triangles; the calling finish
 * owner receives exactly the selected face triangles. This partitions one
 * mesh's existing positions, normals, UVs and vertex colours without adding
 * or moving a triangle. Both outputs retain indexed triangles for geometry
 * auditing. Both callers use the same source mesh and world-plane
 * coordinate, so the assembled surface is unchanged. The outputs are open at
 * this named ownership interface and are not independent closed solids.
 */
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Partition triangles lying wholly on one world-axis plane.
 * @evidence spaces/03-surface-owners.md The structural and room owners can receive disjoint triangles of one already-authored surface boundary.
 * @evidenceReview spaces/03-surface-owners.md #a830535 `partitionPlaneFace` routes each source triangle to one indexed output; the structure and room callers then label their separate support and visible parts under the file owner table.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The room finish is selected from the shared solid without overlapping its support face.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #dae8f88 The room callers take only triangles wholly on the requested upper floor or garage-side step plane; the same source triangles are absent from the corresponding structure bodies.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller supplies the mesh and world plane; this helper chooses no house surface owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This utility receives a mesh, axis, and plane and returns two meshes with compact indices; only its callers provide part ids, roles, colors, and owners.
 * @evidence principles/core/source-units.md#source-substantive-completion The result carries every source triangle and aligned attribute exactly once in a face or body mesh.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Each source triangle is copied once with aligned positions and available attributes, and its new indices address that compact result; incomplete indices, invalid vertices, or an empty side throw.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed surface handoff already assigns support and finish faces to their respective source files; this helper only separates their triangle buffers.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The surface-owner design already separates structural and room-visible faces; retaining indexed output for measurement changes neither that boundary nor any footprint or datum.
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
    indices: [],
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
      target.indices!.push(target.positions.length / 3);
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
