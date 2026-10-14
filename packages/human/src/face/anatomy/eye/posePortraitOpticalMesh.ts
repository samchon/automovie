import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3, IAutoMovieQuaternion } from "@automovie/interface";

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
 * @evidence contracts/common.md#principled-implementation Pitch then yaw rigidly rotate positions about the unchanged globe centre and rotate normals without translation.
 * @evidence contracts/common.md#clear-and-simple-design Canonical quaternion/vector owners preserve mesh dimensions while this adapter owns copied optical buffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero gaze preserves original numbers; finite/alignment admission and final overflow refusal do not normalize away malformed input.
 * @evidence contracts/common.md#meaningful-documentation The prose states millimetres, axis/sign conventions, copied ownership and invalid buffers.
 * @evidence contracts/performance.md#efficient-algorithms Deep mesh copy plus one position/normal traversal is proportional to resident arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work One composed quaternion serves all vertices/normals; the zero-gaze branch reuses copied values without arithmetic transforms.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns its copied mesh; quaternion/vector temporaries expire and the input is unchanged without cache/handles.
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
  const mesh: IAutoMovieMesh = structuredClone(input);
  if (performance.yaw === 0 && performance.pitch === 0) return mesh;
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, performance.yaw),
    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -performance.pitch),
  );
  for (let i: number = 0; i < mesh.positions.length; i += 3) {
    const point: IAutoMovieVector3 = Vector3.create(
      mesh.positions[i],
      mesh.positions[i + 1],
      mesh.positions[i + 2],
    );
    const placed: IAutoMovieVector3 = Vector3.add(
      center,
      Quaternion.rotateVector(rotation, Vector3.subtract(point, center)),
    );
    mesh.positions.splice(i, 3, placed.x, placed.y, placed.z);
  }
  if (mesh.normals !== null)
    for (let i: number = 0; i < mesh.normals.length; i += 3) {
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
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
