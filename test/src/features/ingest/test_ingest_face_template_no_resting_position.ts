import { ingestFaceTemplate } from "@automovie/ingest";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A morphed primitive without a resting POSITION has deltas but nothing to apply them to: the negative twin of the happy path's POSITION carry-over, one attribute away.
 *
 * Scenarios:
 * 1. a primitive carrying only a named morph target (no POSITION) throws; a POSITION accessor without backing array data also throws.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the mapper with a valid named delta but absent resting POSITION and then an unbacked resting accessor; inventing or deferring missing base geometry fails.
 * @evidence contracts/testing.md#independent-expectations Both fixtures author finite delta data independently, changing only absence of the resting attribute or its backing array.
 * @evidence contracts/testing.md#distinguishing-cases Absent resting attribute and absent resting array have distinct diagnostics; valid base/delta correspondence and missing delta storage belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_face_template_no_resting_position entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_face_template_no_resting_position(): void {
  const doc: Document = new Document();
  const buffer: import("@gltf-transform/core").Buffer = doc.createBuffer();
  const prim: import("@gltf-transform/core").Primitive = doc.createPrimitive();
  prim.addTarget(
    doc.createPrimitiveTarget("identity").setAttribute(
      "POSITION",
      doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array([1, 0, 0]))
        .setBuffer(buffer),
    ),
  );
  doc.createMesh("face").addPrimitive(prim);

  TestValidator.predicate(
    "primitive without POSITION throws",
    throwsError(
      (): import("@automovie/interface").IAutoMovieFaceTemplate =>
        ingestFaceTemplate(doc),
      "morphed primitive has no POSITION attribute",
    ),
  );

  const noRestData: Document = new Document();
  const noRestDataBuffer: import("@gltf-transform/core").Buffer =
    noRestData.createBuffer();
  const noRestDataPrim: import("@gltf-transform/core").Primitive = noRestData
    .createPrimitive()
    .setAttribute(
      "POSITION",
      noRestData.createAccessor().setType("VEC3").setBuffer(noRestDataBuffer),
    );
  noRestDataPrim.addTarget(
    noRestData.createPrimitiveTarget("identity").setAttribute(
      "POSITION",
      noRestData
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array([1, 0, 0]))
        .setBuffer(noRestDataBuffer),
    ),
  );
  noRestData.createMesh("face").addPrimitive(noRestDataPrim);

  TestValidator.predicate(
    "primitive POSITION without array throws",
    throwsError(
      (): import("@automovie/interface").IAutoMovieFaceTemplate =>
        ingestFaceTemplate(noRestData),
      ["morphed primitive POSITION accessor", "no array data"],
    ),
  );
}
