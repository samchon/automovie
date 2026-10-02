import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { IPortraitOralAttachment } from "./structures/IPortraitOralAttachment";

/**
 * Place a resident oral mesh without changing its local distances. Positions
 * and normals use the same orthonormal frame; all returned buffers are owned.
 *
 * @evidence contracts/common.md#principled-implementation A rigid change of frame: positions map by origin + x*px + y*py + z*pz and normals by the same rotation without translation, which preserves every local distance because the frame is orthonormal (y is orthogonalized against x by Gram-Schmidt and z = x cross y). The premises are a nonzero chord and a guide not parallel to it, which are refused, and finite coordinates, which are re-checked on the result.
 * @evidence contracts/common.md#clear-and-simple-design One transform shared by the tongue and both dental groups, so the three cannot place their meshes under different frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture or subject is named, and the input is deep-cloned rather than patched; every refusal is a domain failure of the transform.
 * @evidence contracts/common.md#meaningful-documentation The comment states that local distances are preserved, that positions and normals share one frame and that returned buffers are owned; the attachment type documents the frame.
 * @evidence contracts/modeling.md#spatial-conventions Input positions are local millimetres and outputs are head millimetres; the conversion is this one named step, +X from the right to the left corner and +Z anterior.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function transforms one mesh and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel; lift and recess are the attachment's own displacements.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it keeps the mesh's topology.
 * @evidence contracts/modeling.md#shared-boundaries The interiors that share this transform (tongue, upper and lower enamel) are placed by one frame definition, so they cannot drift apart by using different frames; the function itself builds no join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint; the placed interiors are observed under their own declarations.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical value beyond finiteness.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function; the attachment's landmarks orient a mesh that another declaration built.
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
  } = attachment;
  if (
    ![rightCorner, leftCorner, anchor, up].every((v) =>
      [v.x, v.y, v.z].every(Number.isFinite),
    ) ||
    ![lift, recess].every(Number.isFinite)
  )
    throw new Error("Oral attachment needs finite points and offsets.");
  const x = Vector3.normalize(Vector3.subtract(leftCorner, rightCorner));
  const y = Vector3.normalize(
    Vector3.subtract(up, Vector3.scale(x, Vector3.dot(up, x))),
  );
  const z = Vector3.cross(x, y);
  if (Vector3.length(x) === 0 || Vector3.length(y) === 0)
    throw new Error(
      "Oral attachment needs a nonzero chord and independent upward guide.",
    );
  const origin = Vector3.add(
    anchor,
    Vector3.subtract(Vector3.scale(y, lift), Vector3.scale(z, recess)),
  );
  const mesh = structuredClone(input);
  if (mesh.normals === null || mesh.normals.length !== mesh.positions.length)
    throw new Error("Oral attachment needs aligned resident normals.");
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const point = [
        mesh.positions[i],
        mesh.positions[i + 1],
        mesh.positions[i + 2],
      ],
      normal = [mesh.normals[i], mesh.normals[i + 1], mesh.normals[i + 2]];
    for (const [a, key] of ["x", "y", "z"].entries()) {
      const axis = key as "x" | "y" | "z";
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
