import {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
  type IAutoMovieMeshTransform,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { decomposeFiniteBinary64 } from "../../math/internal/decomposeFiniteBinary64";
import { resolveMeshPhysicalVertices } from "../../math/internal/resolveMeshPhysicalVertices";
import { triangleIndicesOf } from "./triangleIndicesOf";

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
 * buildPolyhedron decides each face's frame from world up in
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
export const transformMesh: (
  mesh: IAutoMovieMesh,
  transform: IAutoMovieMeshTransform,
) => IAutoMovieMesh = (
  mesh: IAutoMovieMesh,
  transform: IAutoMovieMeshTransform,
): IAutoMovieMesh => {
  if (mesh.skin !== null)
    throw new Error("procedural mesh transform does not accept skinning");
  const triangles: number[] = triangleIndicesOf(mesh, "mesh transform");
  if (mesh.physicalVertices !== undefined) resolveMeshPhysicalVertices(mesh);
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
  const rotationLength: number = Math.hypot(
    rotation.x,
    rotation.y,
    rotation.z,
    rotation.w,
  );
  if (
    !Number.isFinite(rotationLength) ||
    Math.abs(rotationLength - 1) > UNIT_QUATERNION_EPSILON
  )
    throw new Error("mesh transform rotation must be a unit quaternion");
  const scale: IAutoMovieVector3 = transform.scale ?? { x: 1, y: 1, z: 1 };
  if (
    !AutoMovieEngineVector3.isFinite(translation) ||
    !AutoMovieEngineVector3.isFinite(scale)
  )
    throw new Error("mesh transform translation and scale must be finite");
  if (scale.x === 0 || scale.y === 0 || scale.z === 0)
    throw new Error("mesh transform scale may not collapse an axis");
  const positions: number[] = [];
  for (let index: number = 0; index < mesh.positions.length; index += 3) {
    const position: IAutoMovieVector3 = {
      x: mesh.positions[index]!,
      y: mesh.positions[index + 1]!,
      z: mesh.positions[index + 2]!,
    };
    if (!AutoMovieEngineVector3.isFinite(position))
      throw new Error("mesh transform positions must be finite");
    const placed: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      rotation,
      {
        x: position.x * scale.x,
        y: position.y * scale.y,
        z: position.z * scale.z,
      },
    );
    const x: number = placed.x + translation.x,
      y: number = placed.y + translation.y,
      z: number = placed.z + translation.z;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
      throw new Error("mesh transform positions must remain finite");
    positions.push(x, y, z);
  }
  const source: readonly number[] = mesh.normals ?? [];
  const normals: number[] = [];
  for (let index: number = 0; index < source.length; index += 3) {
    const normal: IAutoMovieVector3 = {
      x: source[index]!,
      y: source[index + 1]!,
      z: source[index + 2]!,
    };
    if (!AutoMovieEngineVector3.isFinite(normal))
      throw new Error("mesh transform normals must be complete finite triples");
    let inverse: IAutoMovieVector3 = {
      x: normal.x / scale.x,
      y: normal.y / scale.y,
      z: normal.z / scale.z,
    };
    if (
      !AutoMovieEngineVector3.isFinite(inverse) ||
      (normal.x !== 0 && Math.abs(inverse.x) < MINIMUM_NORMAL) ||
      (normal.y !== 0 && Math.abs(inverse.y) < MINIMUM_NORMAL) ||
      (normal.z !== 0 && Math.abs(inverse.z) < MINIMUM_NORMAL)
    )
      inverse = inverseScaleDirection(normal, scale);
    let turned: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineQuaternion.rotateVector(rotation, inverse),
    );
    if (!AutoMovieEngineVector3.isFinite(turned))
      turned = AutoMovieEngineVector3.normalize(
        AutoMovieEngineQuaternion.rotateVector(
          rotation,
          AutoMovieEngineVector3.normalize(inverse),
        ),
      );
    if (!AutoMovieEngineVector3.isFinite(turned))
      throw new Error("mesh transform normals must remain finite");
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
    resolveMeshPhysicalVertices(result);
  return result;
};

/*
 * Largest admitted distance of a placement rotation's norm from one.
 */
const UNIT_QUATERNION_EPSILON: number = 1e-6;

/* Keep the normal's direction when a reciprocal scale loses magnitude. */
function inverseScaleDirection(
  normal: IAutoMovieVector3,
  scale: IAutoMovieVector3,
): IAutoMovieVector3 {
  const ratios = (["x", "y", "z"] as const).map((axis) => {
    const numerator = decomposeFiniteBinary64(normal[axis]);
    const denominator = decomposeFiniteBinary64(scale[axis]);
    return {
      value: Number(numerator.significand) / Number(denominator.significand),
      exponent: numerator.exponent - denominator.exponent,
    };
  });
  let common: number = -Infinity;
  for (const ratio of ratios)
    if (ratio.value !== 0) common = Math.max(common, ratio.exponent);
  const read = ({ value, exponent }: (typeof ratios)[number]): number => {
    if (value === 0) return value;
    const power: number = exponent - common;
    return power < -1022
      ? value * 2 ** -1022 * 2 ** (power + 1022)
      : value * 2 ** power;
  };
  return { x: read(ratios[0]!), y: read(ratios[1]!), z: read(ratios[2]!) };
}

const MINIMUM_NORMAL: number = 2 ** -1022;
