import type { V3 } from "../geometry/V3.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import type { EngineViewerInput } from "../viewer/EngineViewerInput.ts";
import type { EvaluationMesh } from "./EvaluationMesh.ts";

/**
 * Admits source millimetres or converts identity-transform engine mesh positions from metres exactly once.
 *
 * @evidence contracts/common.md#principled-implementation Hash-admitted finite coordinates and valid triangle addresses supply Euclidean geometry in one frame.
 * @evidence contracts/common.md#clear-and-simple-design Only evaluator input conversion occurs here; generation never consumes this helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported parts and transforms fail instead of substituting reference geometry.
 * @evidence contracts/common.md#meaningful-documentation States the one unit conversion and identity-transform limitation.
 * @evidence contracts/performance.md#efficient-algorithms One traversal of positions and faces allocates linear evaluation arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Parses the exact hash-admitted bytes once and retains no global cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned arrays belong to one evaluation call; no handle remains open.
 */
export function readEvaluationMesh(
  manifest: ReferenceManifest,
  id: string,
  kind: "source" | "engine",
): { mesh: EvaluationMesh; producer: EngineViewerInput["provenance"] | null } {
  let result: EvaluationMesh;
  let producer: EngineViewerInput["provenance"] | null = null;
  if (kind === "source") result = readInput<EvaluationMesh>(manifest, id);
  else {
    const document: EngineViewerInput = readInput<EngineViewerInput>(
      manifest,
      id,
    );
    if (
      document.schema !== "human-reference-engine-model-v1" ||
      document.model?.origin !== "generated" ||
      !document.provenance?.engineOperators?.length ||
      !/^[a-f0-9]{40,64}$/i.test(document.provenance.sourceCommit)
    )
      throw new Error("Actual engine generation provenance is required");
    producer = document.provenance;
    result = { vertices: [], triangles: [] };
    for (const part of document.model.parts) {
      if (
        part.geometry.type !== "mesh" ||
        part.transform !== null ||
        part.attachedBone !== null
      )
        throw new Error("Evaluation requires root-frame generated mesh parts");
      const mesh: typeof part.geometry.mesh = part.geometry.mesh;
      if (
        !Array.isArray(mesh.positions) ||
        mesh.positions.some(
          (value: unknown): boolean =>
            typeof value !== "number" || !Number.isFinite(value),
        ) ||
        !Array.isArray(mesh.indices) ||
        mesh.indices.length % 3 ||
        mesh.positions.length % 3
      )
        throw new Error(
          "Complete generated triangle positions and indices are required",
        );
      const offset: number = result.vertices.length;
      for (let i: number = 0; i < mesh.positions.length; i += 3)
        result.vertices.push([
          mesh.positions[i] * 1000,
          mesh.positions[i + 1] * 1000,
          mesh.positions[i + 2] * 1000,
        ]);
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const triangle: number[] = mesh.indices.slice(i, i + 3);
        if (
          triangle.some(
            (index: number): boolean =>
              !Number.isInteger(index) ||
              index < 0 ||
              index >= mesh.positions.length / 3,
          )
        )
          throw new Error("Invalid generated part triangle address");
        result.triangles.push([
          triangle[0] + offset,
          triangle[1] + offset,
          triangle[2] + offset,
        ]);
      }
    }
  }
  if (
    !Array.isArray(result.vertices) ||
    !result.vertices.length ||
    result.vertices.some(
      (p: V3): boolean =>
        !Array.isArray(p) ||
        p.length !== 3 ||
        p.some((value: number): boolean => !Number.isFinite(value)),
    )
  )
    throw new Error("Finite physical vertex triples are required");
  if (
    !Array.isArray(result.triangles) ||
    !result.triangles.length ||
    result.triangles.some(
      (t: [number, number, number]): boolean =>
        !Array.isArray(t) ||
        t.length !== 3 ||
        t.some(
          (v: number): boolean =>
            !Number.isInteger(v) || v < 0 || v >= result.vertices.length,
        ),
    )
  )
    throw new Error("Invalid evaluation triangle addresses");
  return { mesh: result, producer };
}
