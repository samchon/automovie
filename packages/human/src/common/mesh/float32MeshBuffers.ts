import { weldedDegenerateTriangles } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFloat32MeshBuffers } from "./IHumanFloat32MeshBuffers";
import type { IHumanFloat32MeshRefusal } from "./IHumanFloat32MeshRefusal";
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
 * A supplied reference owns the original metric redundancy classification;
 * direction is always compared within the input local frame. Every refused
 * face is retained, with the original first refusal wording. An optional
 * origin describes translation back to source space for diagnostics only.
 */
export function float32MeshBuffers(
  mesh: IAutoMovieMesh,
  identity: string = "unnamed resident mesh",
  reference: IAutoMovieMesh = mesh,
  origin?: IAutoMovieVector3,
): IHumanFloat32MeshBuffers {
  const degenerate = new Set(weldedDegenerateTriangles(reference));
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
  const referenceIndices = reference.indices ??
    Array.from({ length: reference.positions.length / 3 }, (_v, i) => i);
  if (reference.positions.length !== mesh.positions.length ||
    referenceIndices.length !== indices.length ||
    referenceIndices.some((vertex, at) => vertex !== indices[at]))
    throw new Error("A Float32 redundancy reference must preserve original vertex and triangle incidence.");
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
  const failures: IHumanFloat32MeshRefusal[] = [];
  let firstError: string | undefined;
  for (let face = 0; face < indices.length; face += 3) {
    if (degenerate.has(face / 3)) continue;
    const before = triangleAreaVector(mesh.positions, indices, face);
    const after = triangleAreaVector(positions, indices, face);
    try {
      assertDirection(before, after, face / 3, "Float32 conversion");
    } catch (error) {
      const corners = Array.from(indices.slice(face, face + 3));
      firstError ??= error instanceof Error ? error.message : String(error);
      const shift = origin === undefined ? [0, 0, 0] : [origin.x, origin.y, origin.z];
      const edgeLengthsMetres = corners.map((vertex, at) => {
        const next = corners[(at + 1) % 3];
        return Math.hypot(...[0, 1, 2].map((axis) =>
          mesh.positions[3 * next + axis] - mesh.positions[3 * vertex + axis],
        ));
      });
      const beforeLength = Math.hypot(before.x, before.y, before.z);
      const afterLength = Math.hypot(after.x, after.y, after.z);
      const longest = Math.max(...edgeLengthsMetres);
      const altitude = beforeLength / longest;
      const aspect = longest / altitude;
      const agreement = (before.x * after.x + before.y * after.y + before.z * after.z) /
        (beforeLength * afterLength);
      failures.push({
            face: face / 3,
            corners,
            before,
            after,
            edgeLengthsMetres,
            minimumAltitudeMetres: Number.isFinite(altitude) ? altitude : null,
            longestEdgeOverMinimumAltitude: Number.isFinite(aspect) ? aspect : null,
            orientationAgreement: Number.isFinite(agreement) ? agreement : null,
            positions: corners.map((vertex) =>
              mesh.positions.slice(3 * vertex, 3 * vertex + 3),
            ),
            float32: corners.map((vertex) =>
              Array.from(positions.slice(3 * vertex, 3 * vertex + 3)),
            ),
            sourcePositions: corners.map((vertex) =>
              reference.positions.slice(3 * vertex, 3 * vertex + 3),
            ),
            origin: origin ?? null,
            translatedFloat32: origin === undefined ? null : corners.map((vertex) =>
              Array.from(positions.slice(3 * vertex, 3 * vertex + 3))
                .map((value, axis) => value + shift[axis]),
            ),
            physical: corners.map((vertex) => {
              const alias = mesh.physicalVertices?.vertices[vertex];
              return alias === undefined || alias === null
                ? null
                : (mesh.physicalVertices!.sources[alias] ?? null);
            }),
          });
    }
  }
  if (firstError !== undefined)
    throw new Error(firstError + " mesh:" + identity + " " +
      JSON.stringify({ ...failures[0], failures }));
  return { positions, normals, uvs, indices };
}
