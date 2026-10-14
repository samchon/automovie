import { ingestFaceTemplate } from "@automovie/ingest";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A delta array whose length disagrees with the resting face is a corrupt asset; importing it would defer the failure to morph time on some parameters only, so the import throws up front.
 *
 * Scenarios:
 * 1. a 3-component POSITION with a 6-component `identity` delta throws.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the mapper with unequal resting/delta component counts and requires the named 6-versus-3 refusal; deferring corrupt shape correspondence fails.
 * @evidence contracts/testing.md#independent-expectations The authored one-vertex resting POSITION and two-vertex delta arrays independently establish the mismatched lengths.
 * @evidence contracts/testing.md#distinguishing-cases This unit owns delta-length refusal; equal-length acceptance and missing resting/delta data are covered by the happy and storage units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_face_template_length_mismatch entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_face_template_length_mismatch(): void {
  const doc: Document = new Document();
  const buffer: import("@gltf-transform/core").Buffer = doc.createBuffer();
  const acc: (array: number[]) => import("@gltf-transform/core").Accessor = (array: number[]): import("@gltf-transform/core").Accessor =>
    doc
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array(array))
      .setBuffer(buffer);

  const prim: import("@gltf-transform/core").Primitive = doc.createPrimitive().setAttribute("POSITION", acc([0, 0, 0]));
  prim.addTarget(
    doc
      .createPrimitiveTarget("identity")
      .setAttribute("POSITION", acc([1, 0, 0, 0, 1, 0])),
  );
  doc.createMesh("face").addPrimitive(prim);

  TestValidator.predicate(
    "mismatched delta length throws",
    throwsError(
      (): import("@automovie/interface").IAutoMovieFaceTemplate => ingestFaceTemplate(doc),
      ['morph target "identity"', "6 components", "expected 3"],
    ),
  );
}
