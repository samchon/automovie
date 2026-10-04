import { createHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/articulation/createHumanBodyAnatomicalInspection";
import { createHumanBodyArticularCandidateModel } from "@automovie/human/body/anatomy/articulation/createHumanBodyArticularCandidateModel";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { readHumanBodyArticularAssetCorrespondence } from "@automovie/human/body/export/readHumanBodyArticularAssetCorrespondence";
import { WebIO } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";

/**
 * Candidate IDs and qualification survive the same real writer as their unchanged static geometry.
 *
 * Scenarios:
 * 1. One, two and four independently specified candidates retain actual source intervals in GLB and glTF.
 * 2. Material reordering and candidate reordering keep primitive-local partitions; legacy output has no candidate namespace.
 * 3. Mutating readback cannot change caller inspection or primitive metadata.
 */
export async function test_human_body_articular_asset_correspondence(): Promise<void> {
  const { basis, document } = bodyAnatomicalInspectionFixture();
  const inspection = createHumanBodyAnatomicalInspection(basis)(document);
  const right = inspection.candidates.map((head) => ({ ...head, part: head.part === "leftHumerus" ? "rightHumerus" as const : "rightFemur" as const, bone: head.bone === "leftUpperArm" ? "rightUpperArm" as const : "rightUpperLeg" as const, center: { ...head.center, x: -head.center.x } }));
  const io = new WebIO();
  for (const candidates of [[inspection.candidates[0]], inspection.candidates, [...inspection.candidates, ...right].reverse()]) {
    const report = { ...inspection, candidates };
    const model = createHumanBodyArticularCandidateModel({ id: document.id, name: document.name, inspection: report });
    if (candidates.length === 4) {
      model.materials.push({ ...model.materials[0], id: "second" });
      model.parts[1].material = "second";
      model.parts[3].material = "second";
    }
    const before = JSON.stringify({ model, report });
    const plain = await exportHumanBody(model);
    const asset = await exportHumanBody(model, report);
    const oldPrimitives = (await io.readBinary(plain.glb)).getRoot().listMeshes().map((mesh) => mesh.listPrimitives()[0]);
    const parsed = [await io.readBinary(asset.glb), await io.readJSON(asset.gltf)];
    TestValidator.equals("unqualified body asset remains legacy", readHumanBodyArticularAssetCorrespondence(oldPrimitives[0]), undefined);
    for (const decoded of parsed) {
      const primitives = decoded.getRoot().listMeshes().map((mesh) => mesh.listPrimitives()[0]);
      const found: string[] = [];
      for (let group = 0; group < primitives.length; group++) {
        const primitive = primitives[group];
        const correspondence = readHumanBodyArticularAssetCorrespondence(primitive)!;
        const expected = model.parts.filter((part) => part.material === model.materials[group].id);
        TestValidator.equals("independent IDs follow actual material member order", correspondence.geometry.parts.map((part) => part.id), expected.map((part) => part.id));
        TestValidator.equals("qualification covers the same population", correspondence.qualification.parts.length, expected.length);
        TestValidator.predicate("qualification IDs bind that same population", correspondence.qualification.parts.every((part, index) => part.id === expected[index].id));
        TestValidator.equals("reference provenance", correspondence.qualification.reference, report.reference);
        TestValidator.equals("whole skin stays unavailable", correspondence.qualification.skin, { status: "unavailable", reason: "geometry-not-validated" });
        TestValidator.predicate("whole parts never become resolved", correspondence.qualification.parts.every((part) => part.partResolution.status === "unavailable" && part.source === "target" && part.registration === "reference-rig-only"));
        for (const attribute of ["POSITION", "NORMAL"])
          TestValidator.equals("metadata preserves exact Float32 attributes", Array.from(primitive.getAttribute(attribute)!.getArray()!), Array.from(oldPrimitives[group].getAttribute(attribute)!.getArray()!));
        TestValidator.equals("metadata preserves actual index buffers", Array.from(primitive.getIndices()!.getArray()!), Array.from(oldPrimitives[group].getIndices()!.getArray()!));
        found.push(...correspondence.geometry.parts.map((part) => part.id));
        correspondence.qualification.reference.basis = "changed";
        TestValidator.equals("owned qualification", readHumanBodyArticularAssetCorrespondence(primitive)!.qualification.reference.basis, report.reference.basis);
      }
      TestValidator.equals("all actual source parts occur once", found.sort((a, b) => a.localeCompare(b)), model.parts.map((part) => part.id).sort((a, b) => a.localeCompare(b)));
    }
    TestValidator.equals("source ownership", JSON.stringify({ model, report }), before);
  }
}
