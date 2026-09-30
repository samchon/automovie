import { weldedDegenerateTriangles } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { assertDirection } from "./assertDirection";
import { triangleAreaVector } from "./triangleAreaVector";

/**
 * Materialize the shared preview/glTF precision boundary and refuse surface loss.
 * Positions, normals and UV0 are Float32; resident triangle indices are Uint32.
 * The existing engine weld rule identifies source triangles already redundant
 * at a pole or seam. Preserve that policy by exact face identity, not by an
 * unchanged aggregate count that could hide one newly lost face behind another.
 *
 * Every other source triangle must keep a finite, nonzero oriented area after
 * quantization. Rounding is a representation conversion, not an authored turn,
 * so an output face opposing its source face is not an acceptable rotation.
 * No photograph, subject name, absolute area threshold or renderer verdict
 * exempts a face. All coordinates remain in the input's local metre frame.
 */
export function float32MeshBuffers(mesh: IAutoMovieMesh): {
  positions: Float32Array<ArrayBuffer>;
  normals: Float32Array<ArrayBuffer> | null;
  uvs: Float32Array<ArrayBuffer> | null;
  indices: Uint32Array<ArrayBuffer>;
} {
  const degenerate = new Set(weldedDegenerateTriangles(mesh));
  if (mesh.normals !== null && mesh.normals.length !== mesh.positions.length)
    throw new Error(
      "Model normal buffers must align with resident positions.",
    );
  const positions = new Float32Array(mesh.positions);
  const normals = mesh.normals === null ? null : new Float32Array(mesh.normals);
  const uvs = mesh.uvs === null ? null : new Float32Array(mesh.uvs);
  if (
    uvs !== null &&
    (uvs.length !== (positions.length / 3) * 2 || !uvs.every(Number.isFinite))
  )
    throw new Error(
      "Model UV0 must remain complete and finite at Float32 precision.",
    );
  const indices = new Uint32Array(
    mesh.indices ??
      Array.from({ length: mesh.positions.length / 3 }, (_v, i) => i),
  );
  if (
    !positions.every(Number.isFinite) ||
    (normals !== null && !normals.every(Number.isFinite))
  )
    throw new Error(
      "Model Float32 buffers must contain only finite components.",
    );
  if (normals !== null)
    for (let offset = 0; offset < normals.length; offset += 3) {
      // glTF NORMAL is a unit direction, including redundant-pole vertices.
      // One Float32 epsilon permits component rounding of an authored unit
      // vector; neither topology redundancy nor finite zero supplies direction.
      const length = Math.hypot(
        normals[offset],
        normals[offset + 1],
        normals[offset + 2],
      );
      if (Math.abs(length - 1) > 2 ** -23)
        throw new Error("Model GLTF NORMAL values must be unit directions.");
    }
  for (let face = 0; face < indices.length; face += 3) {
    if (degenerate.has(face / 3)) continue;
    assertDirection(
      triangleAreaVector(mesh.positions, indices, face),
      triangleAreaVector(positions, indices, face),
      face / 3,
      "Float32 conversion",
    );
  }
  return { positions, normals, uvs, indices };
}
