import { ingestFaceTemplate } from "@automovie/ingest";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Many exporters (and three.js) leave glTF morph targets unnamed and put the names in `mesh.extras.targetNames` instead. The import must fall back to that convention per index, while a target that does carry its own name keeps it over the extras entry.
 *
 * Scenarios:
 * 1. target #0 is unnamed but extras lists "identity"; target #1 is named "jawWidth" while extras lists "WRONG" at its index: the template keys come out ["identity", "jawWidth"].
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the mapper and observes resulting target keys; ignoring extras fallback or overriding an explicit target name fails.
 * @evidence contracts/testing.md#independent-expectations An unnamed first target and named jawWidth second target with contradictory extras author the expected identity/jawWidth keys independently.
 * @evidence contracts/testing.md#distinguishing-cases Absent own-name fallback contrasts with explicit own-name precedence in the same primitive; duplicate, absent and malformed target data belong to separate units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_face_template_extras_names entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_face_template_extras_names(): void {
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
    doc
      .createPrimitiveTarget("jawWidth")
      .setAttribute("POSITION", acc([0, 1, 0])),
  );
  doc
    .createMesh("face")
    .addPrimitive(prim)
    .setExtras({ targetNames: ["identity", "WRONG"] });

  const template: import("@automovie/interface").IAutoMovieFaceTemplate =
    ingestFaceTemplate(doc);
  TestValidator.predicate(
    "extras fallback + own-name precedence",
    test12ValuesClose(
      Object.keys(template.targets).sort((a: string, b: string): number =>
        a.localeCompare(b),
      ),
      ["identity", "jawWidth"],
    ),
  );
}
