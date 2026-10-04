import { createMeshPhysicalPartitionMatcher } from "@automovie/engine/math/createMeshPhysicalPartitionMatcher";
import { validateMeshTopology, weldedDegenerateTriangles } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../internal/createPhysicalMesh";
import { throwsError } from "../internal/predicates";

/**
 * Cache reuse requires source meaning and connectivity, not just equal incidence.
 * Scenarios:
 * 1. Translation and reordered source tables retain an admitted physical partition.
 * 2. Caller mutations of domain, ID, connectivity and aliases invalidate reuse.
 * 3. A capture owns its expectation; changing the captured input cannot alter it.
 * 4. Legacy split/merge and invalid finite/cardinality inputs reject a candidate.
 * 5. Coordinate-collapsed participation changes invalidate physical reuse in
 *    either direction; independent inter-face contact alone preserves it.
 */
export const test_geometry_physical_cache = (): void => {
  const make = () => createPhysicalMesh([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], [0, 1, 2], [4, 5, 6, 4]);
  const source = make();
  const matches = createMeshPhysicalPartitionMatcher(source);
  const translated = make();
  for (let at = 0; at < translated.positions.length; at += 3) translated.positions[at] += 3;
  TestValidator.equals("absolute frame does not change meaning", matches(translated), true);
  const reordered = make();
  reordered.physicalVertices!.sources.reverse();
  reordered.physicalVertices!.vertices = [3, 2, 1, 0];
  TestValidator.equals("table indices are not physical IDs", matches(reordered), true);
  const sequential = createPhysicalMesh(source.positions.slice(0, 9), null, [4, 5, 6]);
  TestValidator.equals("implicit and explicit same triangles", createMeshPhysicalPartitionMatcher(sequential)({ ...sequential, indices: [0, 1, 2] }), true);
  const edits = [
    (mesh: typeof source) => { mesh.physicalVertices!.sources[1].domain = "other"; },
    (mesh: typeof source) => { mesh.physicalVertices!.sources[1].id = 99; },
    (mesh: typeof source) => { mesh.indices = [0, 2, 1]; },
    (mesh: typeof source) => { mesh.positions[9] = 0.51e-9; },
    (mesh: typeof source) => { mesh.physicalVertices!.vertices[3] = null; },
    (mesh: typeof source) => { mesh.physicalVertices!.vertices.pop(); },
    (mesh: typeof source) => { mesh.positions[0] = NaN; },
    (mesh: typeof source) => { mesh.indices = [4, 1, 2]; },
    (mesh: typeof source) => { mesh.indices = [0, 1]; },
    (mesh: typeof source) => { mesh.indices = []; },
    (mesh: typeof source) => { mesh.positions.push(2, 0, 0); mesh.physicalVertices!.vertices.push(null); },
  ];
  for (const edit of edits) {
    const candidate = make(); edit(candidate);
    TestValidator.equals("meaning change or malformed refuses reuse", matches(candidate), false);
    TestValidator.equals("adjacent unchanged candidate", matches(make()), true);
  }
  source.physicalVertices!.sources[0].id = 100;
  source.physicalVertices!.vertices[0] = null;
  source.indices!.reverse();
  TestValidator.equals("capture owns original input", matches(make()), true);
  const legacy = createPhysicalMesh([0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 1, 2]);
  const old = createMeshPhysicalPartitionMatcher(legacy);
  TestValidator.equals("legacy participation starts collapsed", weldedDegenerateTriangles(legacy), [0]);
  TestValidator.equals("legacy translation", old({ ...legacy, positions: [3, 0, 0, 4, 0, 0, 3, 0, 0] }), true);
  TestValidator.equals("legacy split", old({ ...legacy, positions: [0, 0, 0, 1, 0, 0, 2, 0, 0] }), false);
  TestValidator.equals("legacy merge", old({ ...legacy, positions: [0, 0, 0, 0, 0, 0, 0, 0, 0] }), false);
  TestValidator.equals("different cardinality", old(createPhysicalMesh([], [])), false);
  TestValidator.predicate("invalid capture coordinates", throwsError(() => createMeshPhysicalPartitionMatcher(createPhysicalMesh([NaN, 0, 0], []))));
  TestValidator.predicate("invalid capture structure", throwsError(() => createMeshPhysicalPartitionMatcher(createPhysicalMesh([0, 0], []))));
  TestValidator.equals("empty capture", createMeshPhysicalPartitionMatcher(createPhysicalMesh([], []))(createPhysicalMesh([], [])), true);
  const dormant = createPhysicalMesh(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0],
    [0, 1, 2, 1, 0, 3, 0, 1, 4], [0, 1, 2, 3, 4],
  );
  TestValidator.equals("dormant third face is initially admitted", validateMeshTopology({ mesh: dormant }), { success: true });
  TestValidator.equals("initial dormant ordinal", weldedDegenerateTriangles(dormant), [2]);
  const dormantMatch = createMeshPhysicalPartitionMatcher(dormant);
  const fin = createPhysicalMesh(dormant.positions, dormant.indices, [0, 1, 2, 3, 4]);
  fin.positions[14] = 1;
  TestValidator.equals("activation creates a real fin", validateMeshTopology({ mesh: fin }).success, false);
  TestValidator.equals("all fin faces participate", weldedDegenerateTriangles(fin), []);
  TestValidator.equals("activation cannot reuse admission", dormantMatch(fin), false);
  TestValidator.equals("collapse changes participation too", createMeshPhysicalPartitionMatcher(fin)(dormant), false);
  TestValidator.equals("original participation recovery", dormantMatch(dormant), true);
  const moved = createPhysicalMesh(dormant.positions, dormant.indices, [0, 1, 2, 3, 4]);
  for (let at = 0; at < moved.positions.length; at += 3) moved.positions[at] += 3;
  moved.physicalVertices!.sources.reverse();
  moved.physicalVertices!.vertices = [4, 3, 2, 1, 0];
  TestValidator.equals("mask survives translation and table permutation", dormantMatch(moved), true);
  dormant.positions[14] = 1;
  TestValidator.equals("caller mutation cannot rewrite captured mask", dormantMatch(dormant), false);
  dormant.positions[14] = 0;
  TestValidator.equals("mutated source can recover participation", dormantMatch(dormant), true);
  const replacement = createPhysicalMesh(dormant.positions, dormant.indices, [0, 1, 2, 3, 4]);
  replacement.positions[6] = 1;
  replacement.positions[7] = 0;
  replacement.positions[14] = 1;
  TestValidator.equals("one other face is now dormant", weldedDegenerateTriangles(replacement), [0]);
  TestValidator.equals("equal mask count cannot hide replaced face", dormantMatch(replacement), false);
  const separate = createPhysicalMesh(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1],
    [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5],
  );
  const contactMatch = createMeshPhysicalPartitionMatcher(separate);
  const contact = createPhysicalMesh(separate.positions, separate.indices, [0, 1, 2, 3, 4, 5]);
  contact.positions[11] = 0;
  TestValidator.equals("contact does not collapse either face", validateMeshTopology({ mesh: contact }), { success: true });
  TestValidator.equals("contact keeps participation", contactMatch(contact), true);
};
