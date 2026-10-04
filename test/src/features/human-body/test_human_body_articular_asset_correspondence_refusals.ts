import { createGltfDocument } from "@automovie/human/common/export/createGltfDocument";
import { readHumanStaticPartCorrespondence } from "@automovie/human/common/export/readHumanStaticPartCorrespondence";
import { createHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/articulation/createHumanBodyAnatomicalInspection";
import { createHumanBodyArticularCandidateModel } from "@automovie/human/body/anatomy/articulation/createHumanBodyArticularCandidateModel";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { readHumanBodyArticularAssetCorrespondence } from "@automovie/human/body/export/readHumanBodyArticularAssetCorrespondence";
import { WebIO } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";
import { createModel } from "../internal/fixtures";
import { throwsError, rejectsError } from "../internal/predicates";

/**
 * Present metadata must bind actual elements and preserve candidate-only meaning; absence remains legacy.
 *
 * Scenarios:
 * 1. Unsupported/sparse metadata, empty or duplicate IDs, invalid scalar intervals, gaps, overlap and uncovered buffers refuse beside supported recovery.
 * 2. Actual primitive mode/component/attribute/index corruption refuses independently of its declared metadata.
 * 3. Body report and namespace version/qualification/population errors refuse without certifying anatomy or changing caller values.
 */
export async function test_human_body_articular_asset_correspondence_refusals(): Promise<void> {
  const model = createModel(null);
  const mesh = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2], normals: null, uvs: null, skin: null };
  model.parts = [
    { ...model.parts[0], id: "one", geometry: { type: "mesh", mesh } },
    { ...model.parts[0], id: "two", geometry: { type: "mesh", mesh: { ...mesh, positions: [2, 0, 0, 3, 0, 0, 2, 1, 0] } } },
  ];
  const fresh = () => {
    const document = createGltfDocument(model, { sourcePartIdentity: true });
    return { document, primitive: document.getRoot().listMeshes()[0].listPrimitives()[0] };
  };
  const { primitive } = fresh();
  const record = readHumanStaticPartCorrespondence(primitive)!;
  TestValidator.equals("supported partition arranged", record.parts.map((part) => part.id), ["one", "two"]);
  const first = record.parts[0];
  const second = record.parts[1];
  const invalid = [
    undefined, null, { ...record, version: 2 }, { ...record, extra: 1 },
    { ...record, sourceModel: " " }, { ...record, parts: [] },
    { ...record, parts: [{ ...first, id: " " }, second] },
    { ...record, parts: [first, { ...second, id: first.id }] },
    ...[NaN, -1, .5, Number.MAX_SAFE_INTEGER + 1].map((vertexOffset) => ({ ...record, parts: [{ ...first, vertexOffset }, second] })),
    { ...record, parts: [{ ...first, vertexCount: 0 }, second] },
    { ...record, parts: [{ ...first, indexCount: 2 }, second] },
    { ...record, parts: [first, { ...second, vertexOffset: 4 }] },
    { ...record, parts: [first, { ...second, vertexOffset: 2 }] },
    { ...record, parts: [first, { ...second, indexOffset: 4 }] },
    { ...record, parts: [{ ...first, vertexCount: 7 }, second] },
    { ...record, parts: [{ ...first, indexCount: 9 }, second] },
    { ...record, parts: [first] },
    { ...record, parts: [{ ...first, vertexCount: 6 }] },
  ];
  for (const payload of invalid) {
    primitive.setExtras({ automovieSourceParts: payload });
    TestValidator.predicate("present malformed partition refuses", throwsError(() => readHumanStaticPartCorrespondence(primitive)));
    primitive.setExtras({ automovieSourceParts: record });
    TestValidator.equals("adjacent supported recovery", readHumanStaticPartCorrespondence(primitive), record);
  }
  for (const kind of ["mode", "position", "position-type", "position-component", "indices", "index-type", "index-component", "attribute-count", "cross-index", "cross-low-index"] as const) {
    const { document, primitive } = fresh();
    if (kind === "mode") primitive.setMode(1);
    if (kind === "position") primitive.setAttribute("POSITION", null);
    if (kind === "position-type") primitive.getAttribute("POSITION")!.setType("VEC2");
    if (kind === "position-component") primitive.getAttribute("POSITION")!.setArray(new Uint16Array(18));
    if (kind === "indices") primitive.setIndices(null);
    if (kind === "index-type") primitive.getIndices()!.setType("VEC3");
    if (kind === "index-component") primitive.getIndices()!.setArray(new Float32Array([0, 1, 2, 3, 4, 5]));
    if (kind === "attribute-count") primitive.setAttribute("NORMAL", document.createAccessor().setType("VEC3").setArray(new Float32Array(3)));
    if (kind === "cross-index") primitive.getIndices()!.getArray()![0] = 3;
    if (kind === "cross-low-index") primitive.getIndices()!.getArray()![3] = 0;
    TestValidator.predicate("actual binding corruption refuses", throwsError(() => readHumanStaticPartCorrespondence(primitive)));
  }
  const { basis, document } = bodyAnatomicalInspectionFixture();
  const inspection = createHumanBodyAnatomicalInspection(basis)(document);
  const candidateModel = createHumanBodyArticularCandidateModel({ id: document.id, name: document.name, inspection });
  const before = JSON.stringify(inspection);
  for (const malformed of [null, { ...inspection, extra: true }, { ...inspection, skin: { status: "resolved" } }, { ...inspection, candidates: [{ ...inspection.candidates[0], source: "observed" }] }])
    TestValidator.predicate("present report schema remains closed", await rejectsError(() => exportHumanBody(candidateModel, JSON.parse(JSON.stringify(malformed)))));
  for (const report of [
    { ...inspection, generatorRevision: "unknown" },
    { ...inspection, reference: { ...inspection.reference, basis: " " } },
    { ...inspection, candidates: [] },
    { ...inspection, candidates: [inspection.candidates[0], inspection.candidates[0]] },
    { ...inspection, candidates: [inspection.candidates[0]] },
    { ...inspection, candidates: [{ ...inspection.candidates[0], part: "rightHumerus" as const }, inspection.candidates[1]] },
  ]) TestValidator.predicate("report/source mismatch refuses", await rejectsError(() => exportHumanBody(candidateModel, report)));
  const asset = await exportHumanBody(candidateModel, inspection);
  const actual = (await new WebIO().readBinary(asset.glb)).getRoot().listMeshes()[0].listPrimitives()[0];
  const extras = actual.getExtras();
  const qualified = readHumanBodyArticularAssetCorrespondence(actual)!;
  for (const qualification of [
    undefined, { ...qualified.qualification, version: 2 },
    { ...qualified.qualification, generatorRevision: "unknown" },
    { ...qualified.qualification, reference: { ...qualified.qualification.reference, basis: " " } },
    { ...qualified.qualification, parts: [] },
    { ...qualified.qualification, parts: [...qualified.qualification.parts].reverse() },
    { ...qualified.qualification, parts: [{ ...qualified.qualification.parts[0], source: "observed" }, qualified.qualification.parts[1]] },
    { ...qualified.qualification, skin: { status: "resolved" } },
  ]) {
    actual.setExtras({ ...extras, automovieArticularInspection: qualification });
    TestValidator.predicate("unsupported body qualification refuses", throwsError(() => readHumanBodyArticularAssetCorrespondence(actual)));
  }
  actual.setExtras({ automovieArticularInspection: qualified.qualification });
  TestValidator.predicate("body claim needs common binding", throwsError(() => readHumanBodyArticularAssetCorrespondence(actual)));
  actual.setExtras(extras);
  TestValidator.equals("qualified recovery", readHumanBodyArticularAssetCorrespondence(actual), qualified);
  TestValidator.equals("caller report unchanged", JSON.stringify(inspection), before);
}
