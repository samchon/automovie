import { validateModel } from "@automovie/engine";
import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * The face builder carries actual source incidence through performed contact.
 * Scenarios:
 * 1. Two independent square sheets become exactly coincident. Registered
 *    physical IDs retain their manifold edges; legacy coordinate welding
 *    rejects the four-triangle diagonal. No triangle or position is changed.
 * 2. Zero/half/full/return, combined shape/half expression and a second figure
 *    ID keep owned source tables and current source meaning through reuse.
 * 3. Caller/result mutation cannot alter future registration. An empty source
 *    generation and separated source aliases refuse next to valid inputs.
 * 4. Source original/edge/refinement namespace counts bound every sample;
 *    last IDs, sparse wide namespaces and omitted refinements are supported,
 *    while invalid counts, overflow and out-of-domain samples refuse atomically.
 */
export const test_subject_human_face_physical = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const surface = basis.surfaces[0];
  surface.positions.push(...surface.positions.map((v, i) => v + (i % 3 === 2 ? 1 : 0)));
  surface.indices.push(4, 5, 6, 4, 6, 7);
  surface.regions = [{ id: "registered-sheets", material: "skin", indices: surface.indices.slice(), uvs: null }];
  surface.targets.closed = [4, 0, 0, -1, 5, 0, 0, -1, 6, 0, 0, -1, 7, 0, 0, -1];
  basis.channels.push({ id: "close", kind: "expression", minimum: 0, maximum: 1, positive: "closed", negative: null });
  surface.sourcePartition = {
    generation: "physical-source-test", originalVertices: 8,
    parentTriangles: surface.indices.slice(), intersections: [], refinements: [],
    samples: [0, 1, 2, 3, 4, 5, 6, 7], parents: [0, 1, 2, 3],
  };
  const legacyBasis = structuredClone(basis);
  delete legacyBasis.surfaces[0].sourcePartition;
  const legacy = createHumanFaceBasisBuilder(legacyBasis);
  TestValidator.predicate("legacy closed contact refuses", throwsError(() => legacy({ ...document, expression: { close: 1 } }), "not a valid resident model"));
  const build = createHumanFaceBasisBuilder(basis);
  const before = structuredClone(surface.sourcePartition);
  for (const close of [0, 0.5, 1, 1, 0]) {
    const model = build({ ...document, expression: { close } });
    TestValidator.predicate("physical model admitted", validateModel({ model }).success);
    const sheet = model.parts.find(part => part.id === "registered-sheets")!;
    if (sheet.geometry.type !== "mesh") throw new Error("Expected emitted mesh.");
    TestValidator.equals("registered sheet keeps every triangle", sheet.geometry.mesh.indices, [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    TestValidator.equals("actual physical source IDs", sheet.geometry.mesh.physicalVertices!.sources.map(source => source.id), [0, 1, 2, 3, 4, 5, 6, 7]);
    TestValidator.equals("performed height unchanged", sheet.geometry.mesh.positions.filter((_, i) => i % 3 === 2), [0, 0, 0, 0, 1 - close, 1 - close, 1 - close, 1 - close]);
    TestValidator.equals("actual instance and source domain", sheet.geometry.mesh.physicalVertices!.sources[0].domain, JSON.stringify([document.id, before.generation]));
    sheet.geometry.mesh.physicalVertices!.sources[0].id = 999;
  }
  TestValidator.equals("caller source not mutated", surface.sourcePartition, before);
  const shaped = build({ ...document, shape: { width: 0.5 }, expression: { close: 0.5 } }).parts[0].geometry;
  if (shaped.type !== "mesh") throw new Error("Expected emitted mesh.");
  TestValidator.equals("shape and expression preserve physical correspondence", shaped.mesh.physicalVertices!.sources.map(source => source.id), [0, 1, 2, 3, 4, 5, 6, 7]);
  TestValidator.equals("declared shape and half contact both survive", [shaped.mesh.positions[3], shaped.mesh.positions[14]], [1.25, 0.5]);
  const other = build({ ...document, id: "other-person" });
  const mesh = other.parts[0].geometry;
  if (mesh.type !== "mesh") throw new Error("Expected emitted mesh.");
  TestValidator.equals("other instance does not alias", mesh.mesh.physicalVertices!.sources[0].domain, JSON.stringify(["other-person", before.generation]));
  surface.sourcePartition = { ...surface.sourcePartition, samples: [7, 1, 2, 3, 4, 5, 6, 7] };
  const retained = build(document).parts[0].geometry;
  if (retained.type !== "mesh") throw new Error("Expected emitted mesh.");
  TestValidator.equals("builder owns registration", retained.mesh.physicalVertices!.sources[0].id, 0);
  const blank = structuredClone(basis);
  blank.surfaces[0].sourcePartition = { ...blank.surfaces[0].sourcePartition!, generation: " " };
  TestValidator.predicate("blank generation refuses", throwsError(() => createHumanFaceBasisBuilder(blank), "nonempty source generation"));
  const separated = structuredClone(basis);
  separated.surfaces[0].sourcePartition = { ...separated.surfaces[0].sourcePartition!, samples: [1, 1, 2, 3, 4, 5, 6, 7] };
  TestValidator.predicate("separated canonical aliases refuse", throwsError(() => createHumanFaceBasisBuilder(separated), "aliases disagree"));
  const admission = humanFaceBasisFixture();
  const skin = admission.basis.surfaces[0];
  type Source = NonNullable<typeof skin.sourcePartition>;
  const base: Source = {
    generation: "bounded-source", originalVertices: 4,
    parentTriangles: skin.indices.slice(), intersections: [],
    samples: [0, 1, 2, 3], parents: [0, 1],
  };
  const admit = (source: Source): void => {
    skin.sourcePartition = source;
    const before = structuredClone(source);
    const output = createHumanFaceBasisBuilder(admission.basis)(admission.document);
    const last = output.parts[1].geometry;
    if (last.type !== "mesh") throw new Error("Expected emitted mesh.");
    TestValidator.equals("declared last sample survives", last.mesh.physicalVertices!.sources[2].id, source.samples[3]);
    TestValidator.equals("namespace admission retains caller", skin.sourcePartition, before);
  };
  admit(base);
  // The square occupies half of the raw triangle (0,0),(2,0),(0,2).
  // Its three other corners are the exact edge/interior chart samples.
  const parent = { parentTriangles: [0, 1, 2], parents: [0, 0], samples: [0, 3, 4, 5] };
  admit({ ...base, ...parent, originalVertices: 3,
    intersections: [{ a: 0, b: 1, t: 0.5 }, { a: 1, b: 2, t: 0.5 }, { a: 0, b: 2, t: 0.5 }] });
  admit({ ...base, ...parent, originalVertices: 3,
    refinements: [{ parent: 0, coordinates: [0.5, 0] }, { parent: 0, coordinates: [0.5, 0.5] }, { parent: 0, coordinates: [0, 0.5] }] });
  const wideID = Number.MAX_SAFE_INTEGER - 1;
  admit({ ...base, originalVertices: Number.MAX_SAFE_INTEGER,
    parentTriangles: [0, 1, 2, 0, 2, wideID], samples: [0, 1, 2, wideID] });
  for (const source of [
    ...[0, 2, -1, 3.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(originalVertices => ({ ...base, originalVertices })),
    { ...base, originalVertices: 3 },
    { ...base, originalVertices: Number.MAX_SAFE_INTEGER, intersections: [{ a: 0, b: 2, t: 0.5 }] },
    { ...base, originalVertices: Number.MAX_SAFE_INTEGER, refinements: [{ parent: 0, coordinates: [0.5, 0] as [number, number] }] },
    ...[-1, 0.5, 4, Number.MAX_SAFE_INTEGER].map(id => ({ ...base, samples: [0, 1, 2, id] })),
    { ...base, samples: [0, 1, 2] },
  ]) {
    skin.sourcePartition = source;
    const before = structuredClone(source);
    TestValidator.predicate("invalid declared namespace refuses", throwsError(() => createHumanFaceBasisBuilder(admission.basis), "safe canonical source domain"));
    TestValidator.predicate("failed namespace leaves caller unchanged",
      Object.is(skin.sourcePartition.originalVertices, before.originalVertices) &&
      skin.sourcePartition.samples.length === before.samples.length &&
      skin.sourcePartition.samples.every((value, index) => Object.is(value, before.samples[index])) &&
      JSON.stringify(skin.sourcePartition) === JSON.stringify(before));
  }
  admit(base);
};
