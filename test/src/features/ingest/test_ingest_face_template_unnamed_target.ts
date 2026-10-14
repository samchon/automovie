import { ingestFaceTemplate } from "@automovie/ingest";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A morph target that can be named neither from the target itself nor from `mesh.extras.targetNames` is unreachable by any parameter document, so the import throws instead of inventing or dropping a key.
 *
 * Scenarios:
 * 1. one unnamed target with no extras on the mesh throws.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the mapper with an unnamed target and no extras fallback, requiring its target-index diagnostic; inventing a parameter key fails.
 * @evidence contracts/testing.md#independent-expectations The resident target deliberately has POSITION data but neither naming source, so required-name absence is independent of mapper output.
 * @evidence contracts/testing.md#distinguishing-cases This unit owns missing-name refusal; explicit names, extras fallback, own-name precedence and duplicate identity are covered by neighboring units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_face_template_unnamed_target entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_face_template_unnamed_target(): void {
  const doc: Document = new Document();
  const buffer: import("@gltf-transform/core").Buffer = doc.createBuffer();
  const acc: (array: number[]) => import("@gltf-transform/core").Accessor = (
    array: number[],
  ): import("@gltf-transform/core").Accessor =>
    doc
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array(array))
      .setBuffer(buffer);

  const prim: import("@gltf-transform/core").Primitive = doc
    .createPrimitive()
    .setAttribute("POSITION", acc([0, 0, 0]));
  prim.addTarget(
    doc.createPrimitiveTarget().setAttribute("POSITION", acc([1, 0, 0])),
  );
  doc.createMesh("face").addPrimitive(prim);

  TestValidator.predicate(
    "unnameable target throws",
    throwsError(
      (): import("@automovie/interface").IAutoMovieFaceTemplate =>
        ingestFaceTemplate(doc),
      "morph target #0 has no name",
    ),
  );
}
