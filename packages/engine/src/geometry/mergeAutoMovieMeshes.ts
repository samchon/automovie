import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Merge rigid meshes, rebasing their indices in declared order.
 *
 * This concatenates; it is not a boolean union, and no solid-solid union,
 * intersection, or difference exists in this kernel. Two members that overlap
 * come back with both their surfaces, including the parts now inside the other,
 * and an edge where they touch belongs to four triangles rather than two, which
 * `validateMeshTopology` reads as non-manifold. What replaces a boolean here is
 * the region: [extrudeAutoMovieRegion](./proceduralRegionExtrusion.ts) takes the outline and its voids
 * together, so a wall less its openings, a hollow section, and a plate less its
 * cut-outs are each one solid built from one description rather than two solids
 * differenced afterwards. What that does not reach is a subtraction along a
 * direction the section does not run in, a niche that stops partway through a
 * wall among them; that is refused by absence rather than approximated, and
 * [buildAutoMovieWall](./proceduralWall.ts) raises it by name where it bites.
 *
 * Normals and texture coordinates survive only when every member carries them,
 * and that is a stated rule rather than a lapse. A merged buffer is read by
 * vertex index, so a member with no coordinates has no honest filler: zeros
 * would pin its whole surface to one texel of whatever the material samples,
 * which reads as flat paint nothing attributes back to the merge. Dropping the
 * attribute makes the loss visible at the binding instead. The three builders
 * that carry no coordinates each name the atlas-bearing operation that replaces
 * them, so a member that needs to survive a merge is built with one of those.
 * RGB multipliers have an honest identity, white: a coloured member retains
 * its colour while bare neighbours receive white. Entirely bare inputs do not
 * acquire a colour buffer.
 *
 * Every buffer is appended element by element rather than by spreading the
 * source into `push`. A spread is an argument list, and an argument list has a
 * length limit in the low hundreds of thousands: `push(...positions)` throws
 * `Maximum call stack size exceeded` once one member passes roughly forty
 * thousand vertices. Merging a building's members past that size is the whole
 * reason this function exists, so the limit is not one worth inheriting.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Combines authored mesh operands without an argument-list size ceiling.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reindexes each input topology into one deterministic mesh.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-surface-coordinate-convention Decides what a composition does to the coordinate sets its members carry.
 */
export const mergeAutoMovieMeshes = (
  meshes: readonly IAutoMovieMesh[],
): IAutoMovieMesh => {
  if (meshes.some((mesh) => mesh.skin !== null))
    throw new Error("procedural rigid-mesh merge does not accept skinning");
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const keepNormals = meshes.every((mesh) => mesh.normals !== null);
  const keepUvs = meshes.every((mesh) => mesh.uvs !== null);
  const uvs: number[] = [];
  const keepColors = meshes.some((mesh) => mesh.colors !== undefined);
  const colors: number[] = [];
  for (const mesh of meshes) {
    const base = positions.length / 3;
    const count = mesh.positions.length / 3;
    for (const value of mesh.positions) positions.push(value);
    if (keepNormals) for (const value of mesh.normals!) normals.push(value);
    if (keepUvs) for (const value of mesh.uvs!) uvs.push(value);
    if (keepColors)
      for (let index = 0; index < mesh.positions.length; ++index)
        colors.push(mesh.colors === undefined ? 1 : mesh.colors[index]!);
    if (mesh.indices === null)
      for (let index = 0; index < count; ++index) indices.push(index + base);
    else for (const index of mesh.indices) indices.push(index + base);
  }
  return {
    positions,
    normals: keepNormals ? normals : null,
    uvs: keepUvs ? uvs : null,
    ...(keepColors ? { colors } : {}),
    indices,
    skin: null,
  };
};
