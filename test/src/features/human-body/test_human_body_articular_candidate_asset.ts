import { WebIO } from "@gltf-transform/core";
import { createHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/articulation/createHumanBodyAnatomicalInspection";
import { createHumanBodyArticularCandidateModel } from "@automovie/human/body/anatomy/articulation/createHumanBodyArticularCandidateModel";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { float32MeshBuffers } from "@automovie/human/common/mesh/float32MeshBuffers";
import { TestValidator } from "@nestia/e2e";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Actual static readback proves candidate geometry, not complete-bone identity or clinical document roundtrip.
 *
 * Scenarios:
 * 1. Source candidate meshes share independently measured radii and export exact Float32 positions, normals and index intervals.
 * 2. Empty candidates and nonpositive or nonfinite radii refuse without mutating inspection output.
 */
export async function test_human_body_articular_candidate_asset(): Promise<void> {
  const { basis, document } = bodyAnatomicalInspectionFixture();
  const inspection = createHumanBodyAnatomicalInspection(basis)(document);
  const before = JSON.stringify(inspection);
  const model = createHumanBodyArticularCandidateModel({ id: document.id, name: document.name, inspection });
  for (let index = 0; index < model.parts.length; index++) {
    const part = model.parts[index];
    if (part.geometry.type !== "mesh") throw new Error("static mesh expected");
    const head = inspection.candidates[index];
    const positions = part.geometry.mesh.positions;
    for (let offset = 0; offset < positions.length; offset += 3)
      TestValidator.predicate("source radius around known centre", nclose(Math.hypot(positions[offset] - head.center.x, positions[offset + 1] - head.center.y, positions[offset + 2] - head.center.z), head.radiusMetres, 1e-14));
    TestValidator.equals("no hidden UV coordinates", part.geometry.mesh.uvs, null);
    TestValidator.equals("absolute source positions avoid second placement", part.transform, null);
  }
  const packed = model.parts.map((part) => {
    if (part.geometry.type !== "mesh") throw new Error("static mesh expected");
    return float32MeshBuffers(part.geometry.mesh);
  });
  const { glb } = await exportHumanBody(model);
  const root = (await new WebIO().readBinary(glb)).getRoot();
  TestValidator.equals("shared finish merges two candidate parts", root.listMeshes().length, 1);
  const primitive = root.listMeshes()[0].listPrimitives()[0];
  TestValidator.equals("actual GLB POSITION is source Float32", Array.from(primitive.getAttribute("POSITION")!.getArray()!), packed.flatMap((one) => Array.from(one.positions)));
  TestValidator.equals("actual GLB NORMAL is source Float32", Array.from(primitive.getAttribute("NORMAL")!.getArray()!), packed.flatMap((one) => Array.from(one.normals!)));
  const expectedIndices = packed.flatMap((one, index) => Array.from(one.indices, (id) => id + packed.slice(0, index).reduce((sum, earlier) => sum + earlier.positions.length / 3, 0)));
  TestValidator.equals("actual GLB index correspondence", Array.from(primitive.getIndices()!.getArray()!), expectedIndices);
  TestValidator.equals("model construction and export preserve inspection", JSON.stringify(inspection), before);
  TestValidator.predicate("empty candidate model is refused", throwsError(() => createHumanBodyArticularCandidateModel({ id: document.id, name: document.name, inspection: { ...inspection, candidates: [] } }), "Invalid articular"));
  for (const radiusMetres of [0, -1, Infinity, NaN])
    TestValidator.predicate("primitive dimension admission remains armed", throwsError(() => createHumanBodyArticularCandidateModel({ id: document.id, name: document.name, inspection: { ...inspection, candidates: [{ ...inspection.candidates[0], radiusMetres }] } }), "dimensions"));
  const subgrid = (radiusMetres: number) => createHumanBodyArticularCandidateModel({
    id: document.id,
    name: document.name,
    inspection: { ...inspection, candidates: [{ ...inspection.candidates[0], radiusMetres, center: { x: .123456789, y: .234567891, z: .345678912 } }] },
  });
  // These mathematical adapter inputs probe the shared nanometre weld grid,
  // not a clinical radius bound. Aliased latitude edges can cease to be 2-manifold.
  TestValidator.equals("adjacent grid-scale sphere remains admitted", subgrid(1e-9).parts.length, 1);
  TestValidator.predicate("final mesh topology gate stays armed", throwsError(() => subgrid(71e-11), "Invalid articular candidate model"));
}
