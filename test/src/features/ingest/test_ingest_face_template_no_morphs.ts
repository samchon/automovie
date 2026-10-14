import { ingestFaceTemplate } from "@automovie/ingest";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A targetless primitive has no editable morph data and is refused by the mapper.
 *
 * Scenarios:
 * 1. a document holding only a target-less mesh primitive throws.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the mapper with a targetless primitive and requires its no-morph diagnostic; returning an empty template fails.
 * @evidence contracts/testing.md#independent-expectations The resident primitive explicitly declares POSITION and no targets, so no target lookup or implementation output supplies the expected absence.
 * @evidence contracts/testing.md#distinguishing-cases Targetless input is the negative twin of first-morphed selection in the happy unit; named target, storage and name refusals are owned separately.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_face_template_no_morphs entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_face_template_no_morphs(): void {
  const doc: Document = new Document();
  const buffer: import("@gltf-transform/core").Buffer = doc.createBuffer();
  const prim: import("@gltf-transform/core").Primitive = doc
    .createPrimitive()
    .setAttribute(
      "POSITION",
      doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array([0, 0, 0]))
        .setBuffer(buffer),
    );
  doc.createMesh("prop").addPrimitive(prim);

  TestValidator.predicate(
    "no morphed primitive throws",
    throwsError(
      (): import("@automovie/interface").IAutoMovieFaceTemplate =>
        ingestFaceTemplate(doc),
      "document has no primitive with morph targets",
    ),
  );
}
