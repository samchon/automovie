import { ingestFaceTemplate } from "@automovie/ingest";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Two morph targets resolving to the same name are a structural defect: the record write would silently keep only the last sculpt, so the template no longer matches the asset, the degradation the throw-on-structural-defect contract forbids (#1105). The import throws, naming both indices.
 *
 * Scenarios:
 *
 * 1. Two targets both named "smile" (via `mesh.extras.targetNames`) throw with the duplicate and the first index named.
 * 2. Negative twin: names one character apart ("smile", "smild") ingest fine and carry both deltas.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the mapper with duplicate and adjacent distinct target names, requiring a diagnostic or both preserved delta arrays; silent last-write-wins loss fails.
 * @evidence contracts/testing.md#independent-expectations The authored names smile/smile and smile/smild and independently supplied unit-axis deltas distinguish duplicate identity from a one-character difference.
 * @evidence contracts/testing.md#distinguishing-cases Duplicate extras names are contrasted with distinct names carrying both deltas; own-name precedence, unnamed targets and missing storage belong to neighboring mapper units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_face_template_duplicate_name entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_face_template_duplicate_name(): void {
  const build: (names: [string, string]) => Document = (
    names: [string, string],
  ): Document => {
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
    prim.addTarget(
      doc.createPrimitiveTarget().setAttribute("POSITION", acc([0, 2, 0])),
    );
    doc.createMesh("face").addPrimitive(prim).setExtras({ targetNames: names });
    return doc;
  };

  // 1. duplicate names throw with both indices named
  TestValidator.predicate(
    "duplicate morph-target name throws",
    throwsError(
      (): import("@automovie/interface").IAutoMovieFaceTemplate =>
        ingestFaceTemplate(build(["smile", "smile"])),
      'morph target #1 duplicates name "smile" (first at #0)',
    ),
  );

  // 2. negative twin: distinct names one character apart ingest fine
  const template: import("@automovie/interface").IAutoMovieFaceTemplate =
    ingestFaceTemplate(build(["smile", "smild"]));
  TestValidator.predicate(
    "distinct names carry both deltas",
    test12ValuesClose(
      [template.targets["smile"], template.targets["smild"]],
      [
        [1, 0, 0],
        [0, 2, 0],
      ],
    ),
  );
}
