import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import { IPortraitOralAttachment } from "./structures/IPortraitOralAttachment";

/**
 * Place a resident oral mesh without changing its local distances. Positions and normals use the same orthonormal frame; all returned buffers are owned.
 *
 * @evidence contracts/common.md#principled-implementation A normalized inter-corner axis and orthogonal up guide rigidly place local mesh positions and aligned normals.
 * @evidence contracts/common.md#clear-and-simple-design Translation and frame rotation share one attachment basis and preserve local metric distances.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite/degenerate frames, misaligned normals and unrepresentable output refuse instead of fabricated axes.
 * @evidence contracts/common.md#meaningful-documentation Attachment and mesh coordinates share the caller's local frame; all returned buffers are cloned and owned.
 * @evidence contracts/performance.md#efficient-algorithms One full mesh clone and a linear position/normal transformation dominate work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same computed orthonormal frame is reused for every vertex and normal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller mesh stays unchanged and only the returned cloned buffers escape.
 */
export function attachPortraitOralMesh(
  input: IAutoMovieMesh,
  attachment: IPortraitOralAttachment,
): IAutoMovieMesh {
  const {
    rightCorner,
    leftCorner,
    origin: anchor,
    up,
    lift,
    recess,
  }: IPortraitOralAttachment = attachment;
  if (
    ![rightCorner, leftCorner, anchor, up].every((v: ImportedIAutoMovieVector3): boolean =>
      [v.x, v.y, v.z].every(Number.isFinite),
    ) ||
    ![lift, recess].every(Number.isFinite)
  )
    throw new Error("Oral attachment needs finite points and offsets.");
  const x: ImportedIAutoMovieVector3 = Vector3.normalize(Vector3.subtract(leftCorner, rightCorner));
  const y: ImportedIAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(up, Vector3.scale(x, Vector3.dot(up, x))),
  );
  const z: ImportedIAutoMovieVector3 = Vector3.cross(x, y);
  if (Vector3.length(x) === 0 || Vector3.length(y) === 0)
    throw new Error(
      "Oral attachment needs a nonzero chord and independent upward guide.",
    );
  const origin: ImportedIAutoMovieVector3 = Vector3.add(
    anchor,
    Vector3.subtract(Vector3.scale(y, lift), Vector3.scale(z, recess)),
  );
  const mesh: IAutoMovieMesh = structuredClone(input);
  if (mesh.normals === null || mesh.normals.length !== mesh.positions.length)
    throw new Error("Oral attachment needs aligned resident normals.");
  for (let i: number = 0; i < mesh.positions.length; i += 3) {
    const point: number[] = [
        mesh.positions[i],
        mesh.positions[i + 1],
        mesh.positions[i + 2],
      ],
      normal: number[] = [mesh.normals[i], mesh.normals[i + 1], mesh.normals[i + 2]];
    for (const [a, key] of ["x", "y", "z"].entries()) {
      const axis: "x" | "y" | "z" = key as "x" | "y" | "z";
      mesh.positions[i + a] =
        origin[axis] +
        x[axis] * point[0] +
        y[axis] * point[1] +
        z[axis] * point[2];
      mesh.normals[i + a] =
        x[axis] * normal[0] + y[axis] * normal[1] + z[axis] * normal[2];
    }
  }
  if (![...mesh.positions, ...mesh.normals].every(Number.isFinite))
    throw new Error("Oral attachment exceeds its representable range.");
  return mesh;
}
