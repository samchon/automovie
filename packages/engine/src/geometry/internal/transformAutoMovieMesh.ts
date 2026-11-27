import {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
  type IAutoMovieMeshTransform,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { resolveAutoMovieMeshPhysicalVertices } from "../../math/internal/resolveAutoMovieMeshPhysicalVertices";
import { triangleIndicesOf } from "./triangleIndicesOf";

/*
 * Largest admitted distance of a placement rotation's norm from one.
 */
const UNIT_QUATERNION_EPSILON: number = 1e-6;

/*
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
 * buildAutoMoviePolyhedron decides each face's frame from world up in
 * the frame the mesh was built in, so a panel built upright and then laid down
 * by a rotation keeps the upright face's frame while presenting a level face.
 * Build the member in the orientation it will be seen in, or accept that its
 * grain travels with it, which is what a real board does when it is turned.
 *
 * A rotation is where riding along is free. A scale is not, and it is the one
 * case where carrying the atlas unchanged costs the set its unit. A metric set
 * says one unit is one metre of surface, and a scaled placement stretches the
 * surface while leaving the numbers where they were, so a member built at unit
 * size and placed at three times it reads one metre where the surface now
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
 * Parameter mesh: Unskinned mesh in its local metre frame; never modified.
 * Parameter transform: Placement, each field defaulting to identity.
 * Returns: A new mesh whose arrays share nothing with the input; its index
 * buffer is always present.
 * Error when the mesh is skinned, its indices are incomplete or out of
 * range, its physical correspondence is malformed before or after placement,
 * a placement field is not finite, the rotation is not unit within 1e-6, or a
 * scale component is zero.
 */
export const transformAutoMovieMesh: (
  mesh: IAutoMovieMesh,
  transform: IAutoMovieMeshTransform,
) => IAutoMovieMesh = (
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
  const rotation: IAutoMovieQuaternion = transform.rotation ?? {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
  if (
    Math.abs(Math.hypot(rotation.x, rotation.y, rotation.z, rotation.w) - 1) >
    UNIT_QUATERNION_EPSILON
  )
    throw new Error("mesh transform rotation must be a unit quaternion");
  const scale: IAutoMovieVector3 = transform.scale ?? { x: 1, y: 1, z: 1 };
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
  const mirrored: boolean =
    Math.sign(scale.x) * Math.sign(scale.y) * Math.sign(scale.z) < 0;
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
              (
                entry: IAutoMovieMeshPhysicalSource,
              ): IAutoMovieMeshPhysicalSource => ({
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
