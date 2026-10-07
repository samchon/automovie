import { weldedDegenerateTriangles } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFloat32MeshBuffers } from "./IHumanFloat32MeshBuffers";
import { assertDirection } from "./assertDirection";
import { readHumanMeshNormalRefusals } from "./readHumanMeshNormalRefusals";
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
export function float32MeshBuffers(
  mesh: IAutoMovieMesh,
  identity: string = "unnamed resident mesh",
): IHumanFloat32MeshBuffers {
  const degenerate = new Set(weldedDegenerateTriangles(mesh));
  if (mesh.normals !== null && mesh.normals.length !== mesh.positions.length)
    throw new Error("Model normal buffers must align with resident positions.");
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
        throw new Error(
          "Model GLTF NORMAL values must be unit directions: " +
            identity +
            " " +
            JSON.stringify(readHumanMeshNormalRefusals(mesh, normals, indices)),
        );
    }
  for (let face = 0; face < indices.length; face += 3) {
    if (degenerate.has(face / 3)) continue;
    const before = triangleAreaVector(mesh.positions, indices, face);
    const after = triangleAreaVector(positions, indices, face);
    try {
      assertDirection(before, after, face / 3, "Float32 conversion");
    } catch (error) {
      const corners = Array.from(indices.slice(face, face + 3));
      throw new Error(
        (error instanceof Error ? error.message : String(error)) +
          " mesh:" +
          identity +
          " " +
          JSON.stringify({
            face: face / 3,
            corners,
            before,
            after,
            positions: corners.map((vertex) =>
              mesh.positions.slice(3 * vertex, 3 * vertex + 3),
            ),
            float32: corners.map((vertex) =>
              Array.from(positions.slice(3 * vertex, 3 * vertex + 3)),
            ),
            physical: corners.map((vertex) => {
              const alias = mesh.physicalVertices?.vertices[vertex];
              return alias === undefined || alias === null
                ? null
                : (mesh.physicalVertices!.sources[alias] ?? null);
            }),
          }),
      );
    }
  }
  return { positions, normals, uvs, indices };
}
