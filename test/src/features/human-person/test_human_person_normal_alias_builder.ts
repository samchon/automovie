import { createHumanPersonBuilder } from "@automovie/human";
import { findHumanBoundaryLoops } from "@automovie/human/human/seam/findHumanBoundaryLoops";
import { TestValidator } from "@nestia/e2e";

import { humanPersonSourceBasisFixture } from "../internal/humanPersonSourceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Source corner aliases preserve physical topology at the person seam.
 * An analytic tube splits one interior corner's index without changing its
 * canonical sample, coordinates or ancestry. The seam must use that identity
 * while render parts and normal incidence retain the authored aliases.
 * Scenarios:
 * 1. The actual alias topology has an extra boundary before projection, yet
 *    builds the same neck and normals through the source-bound person consumer.
 * 2. Present transport evaluates a final zero-closure face on the same body;
 *    head turn and return preserve the caller's documents and source arrays.
 */
export const test_human_person_normal_alias_builder = (): void => {
  const fixture = humanPersonSourceBasisFixture();
  fixture.face.channels = [{ id: "mouthClose", kind: "expression", minimum: 0, maximum: 1, positive: "closed", negative: null }];
  const face = fixture.face.surfaces[0];
  face.targets.closed = [24, 0.001, 0, 0];
  const original = createHumanPersonBuilder(fixture)(fixture.document);
  const vertex = 8;
  const alias = face.positions.length / 3;
  face.positions.push(...face.positions.slice(vertex * 3, vertex * 3 + 3));
  const at = face.indices.indexOf(vertex);
  face.indices = face.indices.map((value, index) => index === at ? alias : value);
  face.regions[0].indices = [...face.indices];
  face.sourcePartition = { ...face.sourcePartition!, samples: [...face.sourcePartition!.samples, face.sourcePartition!.samples[vertex]] };
  TestValidator.predicate("arranged alias splits raw-index boundary topology", throwsError(() => findHumanBoundaryLoops(face.indices), "boundary"));
  for (const surface of [face, fixture.body.surfaces[0]]) {
    const record = surface.sourcePartition!;
    const parents = Array.from({ length: surface.positions.length / 3 }, (_, one) => record.parents[Math.floor(surface.indices.indexOf(one) / 3)]);
    surface.sourcePartition = { ...record, normalTransport: {
      subdivisions: [], cells: record.parents.map(() => 0),
      bindings: parents.map((parent) => ({ parent })),
    } };
  }
  const before = JSON.stringify(fixture);
  const build = createHumanPersonBuilder(fixture);
  const rest = build(fixture.document);
  TestValidator.equals("canonical neck adds no ribbon", rest.seam.ribbonTriangles, 0);
  const normalAt = (model: typeof rest.model, vertex: number): number[] => {
    const part = model.parts.find((part) => part.id === "face:face/skin")!;
    if (part.geometry.type !== "mesh") throw new Error("Expected analytic skin mesh.");
    return part.geometry.mesh.normals!.slice(vertex * 3, vertex * 3 + 3);
  };
  TestValidator.predicate("physical alias preserves source normal direction", normalAt(rest.model, 0).every((value, axis) => nclose(value, normalAt(original.model, 0)[axis], 1e-12)));
  const pose = { ...fixture.document, body: { ...fixture.document.body, pose: [{ bone: "head" as const, flexion: null, abduction: null, twist: 20 }] } };
  const moved = build(pose);
  TestValidator.predicate("same-body reference follows actual head pose", normalAt(moved.model, 0).some((value, axis) => !nclose(value, normalAt(rest.model, 0)[axis], 1e-8)));
  TestValidator.predicate("return is deterministic", normalAt(build(fixture.document).model, 0).every((value, axis) => nclose(value, normalAt(rest.model, 0)[axis], 1e-12)));
  TestValidator.equals("caller source and input stay unchanged", JSON.stringify(fixture), before);
  const mismatched: typeof fixture = JSON.parse(before);
  mismatched.face.surfaces[0].positions[alias * 3] += 0.001;
  TestValidator.predicate("performed physical aliases cannot disagree", throwsError(() => createHumanPersonBuilder(mismatched)(mismatched.document), ["physicalVertices", "aliases disagree on the coordinate grid"]));
  const distinct: typeof fixture = JSON.parse(before);
  const rawParent = face.sourcePartition.parents[Math.floor(at / 3)];
  const tree = [...face.sourcePartition.parentTriangles];
  const previous = face.sourcePartition.samples[vertex];
  const newSample = face.sourcePartition.originalVertices;
  tree[rawParent * 3 + tree.slice(rawParent * 3, rawParent * 3 + 3).indexOf(previous)] = newSample;
  for (const surface of [distinct.face.surfaces[0], distinct.body.surfaces[0]]) {
    surface.sourcePartition = { ...surface.sourcePartition!, originalVertices: newSample + 1, parentTriangles: tree };
  }
  distinct.face.surfaces[0].sourcePartition = { ...distinct.face.surfaces[0].sourcePartition!,
    samples: face.sourcePartition.samples.map((sample, one) => one === alias ? newSample : sample),
  };
  TestValidator.predicate("coincident distinct samples retain their independent topology", throwsError(() => createHumanPersonBuilder(distinct), "boundary"));
  TestValidator.predicate("a valid source recovers after refusals", normalAt(build(fixture.document).model, 0).every((value, axis) => nclose(value, normalAt(rest.model, 0)[axis], 1e-12)));
  const prefix: typeof fixture = JSON.parse(before);
  const prefixFace = prefix.face.surfaces[0];
  const prefixRecord = prefixFace.sourcePartition!;
  prefixFace.positions = [9, 9, 9, ...prefixFace.positions];
  prefixFace.indices = prefixFace.indices.map((one) => one + 1);
  prefixFace.regions[0].indices = [...prefixFace.indices];
  prefixFace.targets.closed[0] += 1;
  prefixFace.sourcePartition = { ...prefixRecord, samples: [prefixRecord.samples[0], ...prefixRecord.samples], normalTransport: {
    ...prefixRecord.normalTransport!, bindings: [null, ...prefixRecord.normalTransport!.bindings],
  } };
  const prefixed = createHumanPersonBuilder(prefix)(prefix.document);
  TestValidator.predicate("unused alias cannot become the physical seam representative", normalAt(prefixed.model, 0).every((value, axis) => nclose(value, normalAt(rest.model, 0)[axis], 1e-12)));
};
