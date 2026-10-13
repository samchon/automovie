import {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { resolveAutoMovieMeshPhysicalVertices } from "../math/resolveAutoMovieMeshPhysicalVertices";
import { IAutoMovieMeshTransform } from "./IAutoMovieMeshTransform";
import { finiteVector } from "./finiteVector";
import { triangleIndicesOf } from "./triangleIndicesOf";

/** Largest admitted distance of a placement rotation's norm from one. */
const UNIT_QUATERNION_EPSILON: number = 1e-6;

/**
 * Place a rigid mesh by translation, unit quaternion, and per-axis scale.
 *
 * Positions take the full placement, normals take the inverse transpose (so a
 * non-uniform scale does not tilt them off the surface), and a mirroring scale
 * flips triangle winding so the outward face stays outward. UVs ride along
 * untouched, because a placement moves a surface without re-cutting its atlas.
 * Linear RGB and relief weights follow the same vertex identities and are
 * copied unchanged. Physical correspondence is admitted, copied with its
 * original source pairs, and admitted again on the placed positions, because a
 * placement must not separate aliases on the shared weld grid. Reusing a pair
 * in another placement still asserts one point; a later merge refuses
 * disagreement rather than renaming the physical instance.
 *
 * That is what makes a placed member's coordinates local rather than global,
 * and it is the one thing to know before rotating an atlas-bearing member.
 * {@link buildAutoMoviePolyhedron} decides each face's frame from world up in
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
 * @param mesh Unskinned mesh in its local metre frame; never modified.
 * @param transform Placement, each field defaulting to identity.
 * @returns A new mesh whose arrays share nothing with the input; its index buffer is always present.
 * @throws Error when the mesh is skinned, its indices are incomplete or out of range, its physical correspondence is malformed before or after placement, a placement field is not finite, the rotation is not unit within 1e-6, or a scale component is zero.
 *
 * @evidence contracts/common.md#principled-implementation An affine map `x -> R(S x) + t` applied per vertex, with normals mapped by the inverse transpose `R S^-1` and renormalized, and two triangle corners swapped when `det S < 0` so the right-hand-rule normal still points outward; the premise of a unit rotation and nonzero scale is enforced before any vertex is written, and the remaining limitation is that UVs stay in the unscaled metric, as documented above.
 * @evidence contracts/common.md#clear-and-simple-design One function owns placement for every attribute a rigid mesh can carry, reusing `triangleIndicesOf` for index admission and `resolveAutoMovieMeshPhysicalVertices` for correspondence, so part merging, portrait optics and face-preserving placement all place a mesh the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A skinned mesh, a non-unit rotation and a collapsing scale are refused rather than repaired, and physical correspondence is re-admitted after placement instead of trusted, so a placement that separates aliases fails here rather than in a later merge.
 * @evidence contracts/common.md#meaningful-documentation States how each attribute is mapped, why UVs are not rescaled and what that costs, the frame dependence of polyhedron atlases, the physical-correspondence rule, the ownership of the result, and every refusal with its tolerance.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T triangles, positions and normals take one rotation each and indices one copy, O(V + T), plus two linear correspondence resolutions when physical vertices are present; this is the output size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call places one mesh under one transform into buffers the caller owns, so there is nothing to share across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the resolved correspondence tables are discarded after admission, and the new position, normal, UV, color, relief, index and correspondence arrays, linear in V and T, are transferred to the caller.
 */
export const transformAutoMovieMesh = (
  mesh: IAutoMovieMesh,
  transform: IAutoMovieMeshTransform,
): IAutoMovieMesh => {
  if (mesh.skin !== null)
    throw new Error("procedural mesh transform does not accept skinning");
  const triangles: number[] = triangleIndicesOf(mesh, "mesh transform");
  if (mesh.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(mesh);
  const translation: IAutoMovieVector3 = transform.translation ?? {
    x: 0,
    y: 0,
    z: 0,
  };
  finiteVector(translation, "mesh transform translation");
  const rotation: IAutoMovieQuaternion = transform.rotation ?? {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
  if (
    ![rotation.x, rotation.y, rotation.z, rotation.w].every(Number.isFinite) ||
    Math.abs(Math.hypot(rotation.x, rotation.y, rotation.z, rotation.w) - 1) >
      UNIT_QUATERNION_EPSILON
  )
    throw new Error("mesh transform rotation must be a unit quaternion");
  const scale: IAutoMovieVector3 = transform.scale ?? { x: 1, y: 1, z: 1 };
  finiteVector(scale, "mesh transform scale");
  if (scale.x === 0 || scale.y === 0 || scale.z === 0)
    throw new Error("mesh transform scale may not collapse an axis");
  const positions: number[] = [];
  for (let index: number = 0; index < mesh.positions.length; index += 3) {
    const placed: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
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
  const source: readonly number[] = mesh.normals ?? [];
  const normals: number[] = [];
  for (let index: number = 0; index < source.length; index += 3) {
    const turned: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(rotation, {
        x: source[index]! / scale.x,
        y: source[index + 1]! / scale.y,
        z: source[index + 2]! / scale.z,
      }),
    );
    normals.push(turned.x, turned.y, turned.z);
  }
  const mirrored: boolean = scale.x * scale.y * scale.z < 0;
  const indices: number[] = [];
  for (let index: number = 0; index < triangles.length; index += 3)
    indices.push(
      triangles[index]!,
      triangles[index + (mirrored ? 2 : 1)]!,
      triangles[index + (mirrored ? 1 : 2)]!,
    );
  const result: IAutoMovieMesh = {
    positions,
    normals: mesh.normals === null ? null : normals,
    uvs: mesh.uvs === null ? null : [...mesh.uvs],
    ...(mesh.colors === undefined ? {} : { colors: [...mesh.colors] }),
    ...(mesh.reliefWeights === undefined
      ? {}
      : { reliefWeights: [...mesh.reliefWeights] }),
    indices,
    skin: null,
    ...(mesh.physicalVertices === undefined
      ? {}
      : {
          physicalVertices: {
            sources: mesh.physicalVertices.sources.map(
              (entry: IAutoMovieMeshPhysicalSource): IAutoMovieMeshPhysicalSource => ({
                ...entry,
              }),
            ),
            vertices: mesh.physicalVertices.vertices.slice(),
          },
        }),
  };
  if (result.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(result);
  return result;
};
