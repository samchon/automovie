/**
 * Compose rigid meshes without losing vertex-owned colour or named member
 * spans. Face export, formation and authored assets use these proceduralMesh
 * exports. Mesh coordinates are metres; placement applies scale, rotation then
 * translation, inverse-transpose normals and mirror-aware winding. Inputs stay
 * untouched and output arrays are new. Shared index admission precedes placement
 * and group ranges; merge retains the documented optional-attribute policy.
 * This concatenates surfaces and never performs a geometric Boolean union.
 */
import { IAutoMovieMesh } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { finiteVector } from "./proceduralDimensions";
import { triangleIndicesOf } from "./proceduralMeshBuffers";
import {
  IAutoMovieMeshAssembly,
  IAutoMovieMeshGroup,
  IAutoMovieMeshPart,
  IAutoMovieMeshTransform,
} from "./proceduralMeshTypes";

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

/**
 * Place a rigid mesh by translation, unit quaternion, and per-axis scale.
 *
 * Positions take the full placement, normals take the inverse transpose (so a
 * non-uniform scale does not tilt them off the surface), and a mirroring scale
 * flips triangle winding so the outward face stays outward. UVs ride along
 * untouched, because a placement moves a surface without re-cutting its atlas.
 * Linear RGB follows the same vertex identities and is copied unchanged.
 *
 * That is what makes a placed member's coordinates local rather than global,
 * and it is the one thing to know before rotating an atlas-bearing member.
 * [buildAutoMoviePolyhedron](./proceduralPolyhedron.ts) decides each face's frame from world up in
 * the frame the mesh was built in, so a panel built upright and then laid down
 * by a rotation keeps the upright face's frame while presenting a level face.
 * Build the member in the orientation it will be seen in, or accept that its
 * grain travels with it, which is what a real board does when it is turned.
 *
 * A rotation is where riding along is free. A scale is not, and it is the one
 * case where carrying the atlas unchanged costs the set its unit. A metric set
 * says one unit is one metre of surface, and a scaled placement stretches the
 * surface while leaving the numbers where they were, so a member built at
 * unit size and placed at three times it reads one metre where the surface now
 * measures three: the finish comes out three times too large, uniformly. A
 * non-uniform scale is worse than wrong by a constant, because each face takes
 * its own factor and the set stops being metric by any single number at all.
 *
 * Nothing downstream recovers it. `validateTextureScale` measures a binding
 * against the part's own coordinate span and never reads a placement, so a
 * scaled member's declaration passes exactly as it did before it was scaled.
 * Author an atlas-bearing member at the size it will be seen at and place it
 * with translation and rotation, or drop `coordinateSource` on it rather than
 * claiming metres a scale has already falsified.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Applies a declared placement to a reusable mesh operand.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Transforms positions and normals while preserving valid winding.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-surface-coordinate-convention Carries a member's coordinate set through a placement unchanged, which is what keeps the set measured in the frame the member was built in and what reverses its handedness under a mirroring scale.
 */
export const transformAutoMovieMesh = (
  mesh: IAutoMovieMesh,
  transform: IAutoMovieMeshTransform,
): IAutoMovieMesh => {
  if (mesh.skin !== null)
    throw new Error("procedural mesh transform does not accept skinning");
  const triangles = triangleIndicesOf(mesh, "mesh transform");
  const translation = transform.translation ?? { x: 0, y: 0, z: 0 };
  finiteVector(translation, "mesh transform translation");
  const rotation = transform.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
  if (
    ![rotation.x, rotation.y, rotation.z, rotation.w].every(Number.isFinite) ||
    Math.abs(Math.hypot(rotation.x, rotation.y, rotation.z, rotation.w) - 1) >
      1e-6
  )
    throw new Error("mesh transform rotation must be a unit quaternion");
  const scale = transform.scale ?? { x: 1, y: 1, z: 1 };
  finiteVector(scale, "mesh transform scale");
  if (scale.x === 0 || scale.y === 0 || scale.z === 0)
    throw new Error("mesh transform scale may not collapse an axis");
  const positions: number[] = [];
  for (let index = 0; index < mesh.positions.length; index += 3) {
    const placed = Quaternion.rotateVector(rotation, {
      x: mesh.positions[index]! * scale.x,
      y: mesh.positions[index + 1]! * scale.y,
      z: mesh.positions[index + 2]! * scale.z,
    });
    positions.push(
      placed.x + translation.x,
      placed.y + translation.y,
      placed.z + translation.z,
    );
  }
  const source = mesh.normals ?? [];
  const normals: number[] = [];
  for (let index = 0; index < source.length; index += 3) {
    const turned = Vector3.normalize(
      Quaternion.rotateVector(rotation, {
        x: source[index]! / scale.x,
        y: source[index + 1]! / scale.y,
        z: source[index + 2]! / scale.z,
      }),
    );
    normals.push(turned.x, turned.y, turned.z);
  }
  const mirrored = scale.x * scale.y * scale.z < 0;
  const indices: number[] = [];
  for (let index = 0; index < triangles.length; index += 3)
    indices.push(
      triangles[index]!,
      triangles[index + (mirrored ? 2 : 1)]!,
      triangles[index + (mirrored ? 1 : 2)]!,
    );
  return {
    positions,
    normals: mesh.normals === null ? null : normals,
    uvs: mesh.uvs === null ? null : [...mesh.uvs],
    ...(mesh.colors === undefined ? {} : { colors: [...mesh.colors] }),
    indices,
    skin: null,
  };
};

/**
 * Merge placed rigid members and report the index range each one owns.
 *
 * A material group is what lets one merged draw call still say which triangles
 * are the tread and which are the riser, so a finish, a budget, or a quantity
 * take-off can address a member after the buffers were concatenated.
 *
 * Each member is placed through {@link transformAutoMovieMesh} and the result
 * concatenated by {@link mergeAutoMovieMeshes}, so both of their coordinate
 * rules apply here and this is where an author meets them. One member without
 * coordinates costs the whole assembly its atlas, and a member placed with a
 * scale keeps coordinates that no longer measure its surface. Reuse is what
 * makes the second bite: building one member and placing it at several sizes is
 * exactly the economy this function exists for, and it is the case that
 * falsifies a metric declaration. Place a reused atlas-bearing member by
 * translation and rotation, and build a second one where the size differs.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Merges geometry while retaining named group membership.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Reports the exact index span contributed by each member.
 */
export const mergeAutoMovieMeshParts = (
  parts: readonly IAutoMovieMeshPart[],
): IAutoMovieMeshAssembly => {
  const seen = new Set<string>();
  for (const part of parts) {
    if (part.id.trim().length === 0)
      throw new Error("mesh part id must be non-empty");
    if (seen.has(part.id))
      throw new Error(`mesh part id "${part.id}" must be unique`);
    seen.add(part.id);
  }
  const placed = parts.map((part) => {
    triangleIndicesOf(part.mesh, `mesh part "${part.id}"`);
    return part.transform === undefined
      ? part.mesh
      : transformAutoMovieMesh(part.mesh, part.transform);
  });
  const groups: IAutoMovieMeshGroup[] = [];
  let start = 0;
  placed.forEach((mesh, index) => {
    const count = mesh.indices?.length ?? mesh.positions.length / 3;
    groups.push({ id: parts[index]!.id, start, count });
    start += count;
  });
  return { mesh: mergeAutoMovieMeshes(placed), groups };
};
