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
 *
 * @evidence contracts/common.md#principled-implementation Float32 attributes/Uint32 incidence remain finite/aligned, each nonredundant reference face retains direction, and NORMAL length stays within one Float32 epsilon. Original engine redundancy identifies faces rather than aggregate counts.
 * @evidence contracts/common.md#clear-and-simple-design The shared preview/glTF boundary reuses engine redundancy, orientation admission and actual normal diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No photograph, subject, absolute area threshold or renderer verdict exempts loss; optional origin is diagnostic only and every refused face remains recorded.
 * @evidence contracts/common.md#meaningful-documentation The prose gives local/reference frames, incidence matching, quantized area/direction checks and full refusal diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, T faces and F refusals, conversion/scans/checks cost O(V+T+F) plus welding; normal failures add their incident-reader work and diagnostics occupy O(F).
 * @evidence contracts/performance.md#reuse-equivalent-work Reference redundancy is computed once and each before/after vector serves admission and diagnostics; mutable mesh/reference policy has no shared conversion cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Admitted typed buffers transfer; sets, copied failures and JSON expire on return/refusal with input-sized lifetime, no native handles/tasks.
 */
export function float32MeshBuffers(
  mesh: IAutoMovieMesh,
  identity: string = "unnamed resident mesh",
  reference: IAutoMovieMesh = mesh,
  origin?: IAutoMovieVector3,
): IHumanFloat32MeshBuffers {
  const degenerate: Set<number> = new Set(weldedDegenerateTriangles(reference));
  if (mesh.normals !== null && mesh.normals.length !== mesh.positions.length)
    throw new Error("Model normal buffers must align with resident positions.");
  const positions: Float32Array<ArrayBuffer> = new Float32Array(mesh.positions);
  const normals: Float32Array<ArrayBuffer> | null = mesh.normals === null ? null : new Float32Array(mesh.normals);
  const uvs: Float32Array<ArrayBuffer> | null = mesh.uvs === null ? null : new Float32Array(mesh.uvs);
  if (
    uvs !== null &&
    (uvs.length !== (positions.length / 3) * 2 || !uvs.every(Number.isFinite))
  )
    throw new Error(
      "Model UV0 must remain complete and finite at Float32 precision.",
    );
  const indices: Uint32Array<ArrayBuffer> = new Uint32Array(
    mesh.indices ??
      Array.from({ length: mesh.positions.length / 3 }, (_value: unknown, i: number): number => i),
  );
  const referenceIndices: number[] = reference.indices ??
    Array.from({ length: reference.positions.length / 3 }, (_value: unknown, i: number): number => i);
  if (reference.positions.length !== mesh.positions.length ||
    referenceIndices.length !== indices.length ||
    referenceIndices.some((vertex: number, at: number): boolean => vertex !== indices[at]))
    throw new Error("A Float32 redundancy reference must preserve original vertex and triangle incidence.");
  if (
    !positions.every(Number.isFinite) ||
    (normals !== null && !normals.every(Number.isFinite))
  )
    throw new Error(
      "Model Float32 buffers must contain only finite components.",
    );
  if (normals !== null)
    for (let offset: number = 0; offset < normals.length; offset += 3) {
      // glTF NORMAL is a unit direction, including redundant-pole vertices.
      // One Float32 epsilon permits component rounding of an authored unit
      // vector; neither topology redundancy nor finite zero supplies direction.
      const length: number = Math.hypot(
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
  for (let face: number = 0; face < indices.length; face += 3) {
    if (degenerate.has(face / 3)) continue;
    const before: IAutoMovieVector3 = triangleAreaVector(mesh.positions, indices, face);
    const after: IAutoMovieVector3 = triangleAreaVector(positions, indices, face);
    try {
      assertDirection(before, after, face / 3, "Float32 conversion");
    } catch (error) {
      const corners: number[] = Array.from(indices.slice(face, face + 3));
      firstError ??= error instanceof Error ? error.message : String(error);
      const shift: number[] = origin === undefined ? [0, 0, 0] : [origin.x, origin.y, origin.z];
      const edgeLengthsMetres: number[] = corners.map((vertex: number, at: number): number => {
        const next: number = corners[(at + 1) % 3];
        return Math.hypot(...[0, 1, 2].map((axis: number): number =>
          mesh.positions[3 * next + axis] - mesh.positions[3 * vertex + axis],
        ));
      });
      const beforeLength: number = Math.hypot(before.x, before.y, before.z);
      const afterLength: number = Math.hypot(after.x, after.y, after.z);
      const longest: number = Math.max(...edgeLengthsMetres);
      const altitude: number = beforeLength / longest;
      const aspect: number = longest / altitude;
      const agreement: number = (before.x * after.x + before.y * after.y + before.z * after.z) /
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
            positions: corners.map((vertex: number): number[] =>
              mesh.positions.slice(3 * vertex, 3 * vertex + 3),
            ),
            float32: corners.map((vertex: number): number[] =>
              Array.from(positions.slice(3 * vertex, 3 * vertex + 3)),
            ),
            sourcePositions: corners.map((vertex: number): number[] =>
              reference.positions.slice(3 * vertex, 3 * vertex + 3),
            ),
            origin: origin ?? null,
            translatedFloat32: origin === undefined ? null : corners.map((vertex: number): number[] =>
              Array.from(positions.slice(3 * vertex, 3 * vertex + 3))
                .map((value: number, axis: number): number => value + shift[axis]),
            ),
            physical: corners.map((vertex: number): IHumanFloat32MeshRefusal["physical"][number] => {
              const alias: number | null | undefined = mesh.physicalVertices?.vertices[vertex];
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
