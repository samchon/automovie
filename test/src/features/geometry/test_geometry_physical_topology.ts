import { inspectAutoMovieMeshTopology, validateMeshTopology, validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../internal/createPhysicalMesh";
import { createModel } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/**
 * Contact of separate closed shells cannot manufacture a physical four-face edge.
 * Scenarios:
 * 1. Two tetrahedra touch on one edge: coordinate topology refuses, physical passes.
 * 2. A genuine three-face shared source edge and a repeated direction still refuse.
 * 3. Open/closed declarations and a coordinate-collapsed triangle retain meaning.
 * 4. Inspector and resident model share physical incidence; coordinate degeneracy
 *    and source-correspondence refusals remain independent observations.
 */
export const test_geometry_physical_topology = (): void => {
  const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1,
    0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 0, -1];
  const tetra = [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3];
  const indices = [...tetra, ...tetra.map((vertex) => vertex + 4)];
  const contact = createPhysicalMesh(positions, indices);
  const old = validateMeshTopology({ mesh: contact, expectClosed: true });
  TestValidator.predicate("legacy contact refuses", !old.success && old.violations.length === 3);
  TestValidator.equals("legacy inspector four-face edge", inspectAutoMovieMeshTopology(contact).nonManifoldEdges, 1);
  contact.physicalVertices = {
    sources: Array.from({ length: 8 }, (_v, id) => ({ domain: "two-shell-instance", id })),
    vertices: Array.from({ length: 8 }, (_v, id) => id),
  };
  TestValidator.equals("physical closed contact", validateMeshTopology({ mesh: contact, expectClosed: true }), { success: true });
  const model = createModel(null);
  model.origin = "imported";
  model.parts = model.parts.map((part) => ({ ...part, geometry: { type: "mesh", mesh: contact } }));
  TestValidator.equals("resident model gate reaches correspondence", validateModel({ model }), { success: true });
  const facts = inspectAutoMovieMeshTopology(contact);
  TestValidator.equals("physical incidence", [facts.watertight, facts.nonManifoldEdges, facts.boundaryEdges, facts.triangles], [true, 0, 0, 8]);
  TestValidator.predicate("volume remains geometry", nclose(facts.volume, 1 / 3, 1e-12));
  const fin = createPhysicalMesh(positions.slice(0, 15), [0, 1, 2, 1, 0, 3, 0, 1, 4], [0, 1, 2, 3, 4]);
  // v4 is moved off the edge so the third face has actual nonzero area.
  fin.positions.splice(12, 3, 0, -1, 0);
  TestValidator.equals("fin has three genuine faces", inspectAutoMovieMeshTopology(fin).degenerate, 0);
  const refusal = validateMeshTopology({ mesh: fin });
  TestValidator.predicate("real fin remains refusal", !refusal.success && refusal.violations.some((v) => v.expected.includes("2-manifold")));
  const open = createPhysicalMesh(positions.slice(0, 9), [0, 1, 2], [0, 1, 2]);
  TestValidator.equals("open surface", validateMeshTopology({ mesh: open }), { success: true });
  TestValidator.equals("closed requirement armed", validateMeshTopology({ mesh: open, expectClosed: true }).success, false);
  const flipped = createPhysicalMesh(positions.slice(0, 12), [0, 1, 2, 0, 1, 3], [0, 1, 2, 3]);
  TestValidator.equals("repeated physical direction", validateMeshTopology({ mesh: flipped }).success, false);
  const collapsed = createPhysicalMesh([0, 0, 0, 0, 0, 0, 1, 0, 0], null, [0, 1, 2]);
  TestValidator.equals("coordinate collapse remains redundant", inspectAutoMovieMeshTopology(collapsed).degenerateTriangles, [0]);
  TestValidator.equals("coordinate redundant topology", validateMeshTopology({ mesh: collapsed }), { success: true });
  contact.physicalVertices.vertices[0] = -1;
  const invalidModel = validateModel({ model });
  TestValidator.predicate("resident model named metadata refusal", !invalidModel.success &&
    invalidModel.violations.some((fault) => fault.path.endsWith(".physicalVertices")));
};
