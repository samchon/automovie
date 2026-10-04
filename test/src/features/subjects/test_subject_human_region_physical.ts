import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import { createHumanBasisRegion } from "@automovie/human/common/basis/createHumanBasisRegion";
import { humanPhysicalSourceDomain } from "@automovie/human/common/basis/humanPhysicalSourceDomain";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Region correspondence preserves physical sources across UV seams and contact.
 * Scenarios:
 * 1. One split UV vertex keeps its canonical ID; a distinct coincident point
 *    stays distinct. XYZ, UV, indices, colours and metadata are owned copies.
 * 2. A new figure domain and different dense sample IDs are read per evaluation;
 *    omitted registration keeps legacy welding and an empty region stays empty.
 * 3. Blank domains, wrong cardinality, unsafe/negative/fractional/nonfinite or
 *    sparse IDs refuse; the engine independently refuses separated aliases.
 * 4. The shared namespace owner preserves quotes, delimiter placement and exact
 *    whitespace, rejects blank identities and supports the largest safe ID.
 */
export const test_subject_human_region_physical = (): void => {
  const instance = "actor\"/one", registration = "native:indexed/source";
  TestValidator.equals("exact primitive identities survive encoding", JSON.parse(humanPhysicalSourceDomain(instance, registration)), [instance, registration]);
  TestValidator.predicate("delimiter positions cannot collide", humanPhysicalSourceDomain("a/b", "c") !== humanPhysicalSourceDomain("a", "b/c"));
  TestValidator.predicate("instances and registrations stay independent", humanPhysicalSourceDomain("a", "b") !== humanPhysicalSourceDomain("b", "a"));
  TestValidator.equals("admitted whitespace is identity", JSON.parse(humanPhysicalSourceDomain(" a ", " b ")), [" a ", " b "]);
  for (const pair of [["", "g"], [" \n", "g"], ["i", ""], ["i", "\t"]])
    TestValidator.predicate("missing namespace owner refuses", throwsError(() => humanPhysicalSourceDomain(pair[0], pair[1]), "nonempty instance and registration"));
  const gather = createHumanBasisRegion({
    indices: [0, 1, 2, 0, 2, 3],
    uvs: [0, 0, 1, 0, 1, 1, 0.5, 0, 1, 1, 0, 0],
  });
  const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0];
  const normals = positions.map((_, i) => i % 3 === 2 ? 1 : 0);
  const samples = [10, 11, 12, 13];
  const physical = { domain: "instance-a/source-1", samples };
  const mesh = gather(positions, normals, normals, physical);
  TestValidator.equals("UV gather has five render vertices", mesh.positions.length, 15);
  TestValidator.equals("UV split source IDs", mesh.physicalVertices!.sources.map(source => source.id), [10, 11, 12, 10, 13]);
  TestValidator.equals("resident table references", mesh.physicalVertices!.vertices, [0, 1, 2, 3, 4]);
  TestValidator.equals("source identities survive contact", resolveAutoMovieMeshPhysicalVertices(mesh).vertices, [0, 1, 2, 0, 3]);
  TestValidator.equals("legacy merges coincident points", resolveAutoMovieMeshPhysicalVertices(gather(positions, normals)).vertices, [0, 1, 2, 0, 0]);
  mesh.positions[0] = 8;
  mesh.normals![0] = 8;
  mesh.colors![0] = 8;
  mesh.uvs![0] = 8;
  mesh.indices![0] = 4;
  mesh.physicalVertices!.sources[0].id = 999;
  mesh.physicalVertices!.vertices[0] = null;
  const recovered = gather(positions, normals, normals, physical);
  TestValidator.equals("fresh arrays retain inputs", [recovered.positions[0], recovered.normals![0], recovered.colors![0], recovered.uvs![0], recovered.indices![0], recovered.physicalVertices!.sources[0].id, recovered.physicalVertices!.vertices[0]], [0, 0, 0, 0, 0, 10, 0]);
  const other = gather(positions, normals, undefined, { domain: "instance-b/source-1", samples: [20, 21, 22, 23] });
  TestValidator.equals("new current instance", other.physicalVertices!.sources[0], { domain: "instance-b/source-1", id: 20 });
  TestValidator.equals("safe integer boundary stays an opaque ID", gather(positions, normals, undefined, { domain: "wide-id", samples: [Number.MAX_SAFE_INTEGER, 1, 2, 3] }).physicalVertices!.sources[0].id, Number.MAX_SAFE_INTEGER);
  TestValidator.equals("absent metadata is absent", gather(positions, normals).physicalVertices, undefined);
  TestValidator.equals("empty registered region", createHumanBasisRegion({ indices: [], uvs: null })([], [], undefined, { domain: "empty", samples: [] }).physicalVertices, { sources: [], vertices: [] });
  for (const bad of [
    { domain: " ", samples }, { domain: "a", samples: [0] },
    ...[-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(id => ({ domain: "a", samples: [id, 1, 2, 3] })),
    { domain: "a", samples: new Array<number>(4) },
  ]) TestValidator.predicate("invalid registration refuses", throwsError(() => gather(positions, normals, undefined, bad), "physical registration"));
  const separated = gather(positions, normals, undefined, { domain: "a", samples: [0, 0, 2, 3] });
  TestValidator.predicate("separated canonical aliases refuse at engine admission", throwsError(() => resolveAutoMovieMeshPhysicalVertices(separated), "aliases disagree"));
};
