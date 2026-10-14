import { ingestFaceTemplate } from "@automovie/ingest";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Defective morph geometry throws rather than degrades: a morphed primitive must carry a resting POSITION, and every target must carry POSITION deltas.
 *
 * Scenarios:
 * 1. a named target without POSITION deltas (on a primitive that has resting positions) throws; a target POSITION accessor without backing array data throws before morphing can defer the failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the mapper with a named target missing POSITION and then with a POSITION accessor lacking data, requiring each storage-specific refusal.
 * @evidence contracts/testing.md#independent-expectations The authored resting POSITION is valid in both fixtures, while delta attribute absence and unbacked accessor storage independently identify the failed boundary.
 * @evidence contracts/testing.md#distinguishing-cases Missing delta attribute and missing delta array are distinct cases; valid deltas and missing resting data are covered by the neighboring units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_face_template_no_position entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_face_template_no_position(): void {
  const doc: Document = new Document();
  const buffer: import("@gltf-transform/core").Buffer = doc.createBuffer();
  const prim: import("@gltf-transform/core").Primitive = doc.createPrimitive().setAttribute(
    "POSITION",
    doc
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array([0, 0, 0]))
      .setBuffer(buffer),
  );
  prim.addTarget(doc.createPrimitiveTarget("identity"));
  doc.createMesh("face").addPrimitive(prim);

  TestValidator.predicate(
    "target without deltas throws",
    throwsError(
      (): import("@automovie/interface").IAutoMovieFaceTemplate => ingestFaceTemplate(doc),
      'morph target "identity" has no POSITION deltas',
    ),
  );

  const noDeltaData: Document = new Document();
  const noDeltaDataBuffer: import("@gltf-transform/core").Buffer = noDeltaData.createBuffer();
  const noDeltaDataPrim: import("@gltf-transform/core").Primitive = noDeltaData.createPrimitive().setAttribute(
    "POSITION",
    noDeltaData
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array([0, 0, 0]))
      .setBuffer(noDeltaDataBuffer),
  );
  noDeltaDataPrim.addTarget(
    noDeltaData
      .createPrimitiveTarget("identity")
      .setAttribute(
        "POSITION",
        noDeltaData
          .createAccessor()
          .setType("VEC3")
          .setBuffer(noDeltaDataBuffer),
      ),
  );
  noDeltaData.createMesh("face").addPrimitive(noDeltaDataPrim);

  TestValidator.predicate(
    "target without delta array throws",
    throwsError(
      (): import("@automovie/interface").IAutoMovieFaceTemplate => ingestFaceTemplate(noDeltaData),
      ['morph target "identity"', "POSITION accessor", "no array data"],
    ),
  );
}
