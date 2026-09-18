import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";
import { assertPortraitEyePerformance } from "./assertPortraitEyePerformance";
import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";

/**
 * Rotate an optical mesh about its unchanged globe centre. All distances use
 * the mesh's construction millimetres, while normals receive rotation only.
 * A zero gaze difference preserves every number rather than renormalizing it.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Rotates iris and corneal geometry for gaze without changing their size or thickness.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Applies one rigid optical transform shared by drawing and contact.
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
