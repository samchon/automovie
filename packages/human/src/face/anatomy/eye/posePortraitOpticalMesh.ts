import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { assertPortraitEyePerformance } from "./assertPortraitEyePerformance";
import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";

/**
 * Rotate an optical mesh about its unchanged globe centre. All distances use
 * the mesh's construction millimetres, while normals receive rotation only.
 * A zero gaze difference preserves every number rather than renormalizing it.
 *
 * Positive yaw turns a forward (+Z) point towards +X, the anatomical left, and
 * positive pitch turns it towards +Y, up. The pitch is applied about the
 * head's X axis and the yaw about its Y axis, both through `center`, so every
 * point's distance from `center`, and hence the globe's radius, is unchanged. Normals receive the rotation without the
 * translation. The result is a copy; the input mesh is never modified. A
 * performance outside its ranges, a non-finite centre or coordinate, buffers
 * whose triples do not align, and a rotation that overflows finite numbers all
 * throw.
 *
 * @evidence contracts/common.md#principled-implementation A rotation about a fixed centre is rigid, so it preserves every distance to that centre, and rotating a unit normal by the same quaternion without translation keeps it a unit normal of the rotated surface. Building the quaternion from a yaw about Y and a pitch about X composes two exact axis rotations, and the identity case returns the copy untouched so zero gaze introduces no rounding.
 * @evidence contracts/common.md#clear-and-simple-design One function rotates one mesh about one centre by one performance; positions and normals share a single quaternion and no option or state exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rotation is a function of the mesh, centre and gaze only, with no case named after a subject or fixture and no foreign method replaced.
 * @evidence contracts/common.md#meaningful-documentation The comment states the sign convention of each angle, the axes, what is preserved, the ownership of the result and every refusal.
 * @evidence contracts/modeling.md#spatial-conventions Positions and centre share the head's right-handed millimetre frame (+X left, +Y up, +Z anterior) and angles are degrees; no unit or frame is converted, and the rotation is a named step about the globe centre.
 * @evidence contracts/anatomy.md#parametric-authority The input is the named physiological motion of gaze as yaw and pitch relative to the observation; no input addresses a vertex.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function rotates a mesh it is given and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the performance record and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits the vertex and index population of its input and no primitive of its own.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and moves a mesh rigidly about its own centre, so no boundary it shares with another part changes shape.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the optical parts it rotates are observed under the eye component.
 */
export function posePortraitOpticalMesh(
  input: IAutoMovieMesh,
  center: IAutoMovieVector3,
  performance: IPortraitEyePerformance,
): IAutoMovieMesh {
  assertPortraitEyePerformance(performance);
  if (
    ![center.x, center.y, center.z, ...input.positions].every(
      Number.isFinite,
    ) ||
    input.positions.length % 3 !== 0 ||
    (input.normals !== null &&
      (input.normals.length !== input.positions.length ||
        !input.normals.every(Number.isFinite)))
  )
    throw new Error(
      "Optical rotation needs a finite centre and aligned position/normal triples.",
    );
  const mesh = structuredClone(input);
  if (performance.yaw === 0 && performance.pitch === 0) return mesh;
  const rotation = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, performance.yaw),
    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -performance.pitch),
  );
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const point = Vector3.create(
      mesh.positions[i],
      mesh.positions[i + 1],
      mesh.positions[i + 2],
    );
    const placed = Vector3.add(
      center,
      Quaternion.rotateVector(rotation, Vector3.subtract(point, center)),
    );
    mesh.positions.splice(i, 3, placed.x, placed.y, placed.z);
  }
  if (mesh.normals !== null)
    for (let i = 0; i < mesh.normals.length; i += 3) {
      const normal = Quaternion.rotateVector(
        rotation,
        Vector3.create(
          mesh.normals[i],
          mesh.normals[i + 1],
          mesh.normals[i + 2],
        ),
      );
      mesh.normals.splice(i, 3, normal.x, normal.y, normal.z);
    }
  if (
    !mesh.positions.every(Number.isFinite) ||
    (mesh.normals !== null && !mesh.normals.every(Number.isFinite))
  )
    throw new Error(
      "Optical rotation exceeds representable coordinates or normals.",
    );
  return mesh;
}
