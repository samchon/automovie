import type { IAutoMovieHumanBasisSourcePartition } from "@automovie/human/common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanBasisNormalTransport } from "@automovie/human/common/basis/IAutoMovieHumanBasisNormalTransport";
import { createHumanPersonSourceNormals } from "@automovie/human/human/build/createHumanPersonSourceNormals";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";
import { humanSourcePartitionFixture } from "../internal/humanSourcePartitionFixture";

/**
 * A refined roof deforms its normal field while retaining an unchanged neighbor.
 * The independent area oracle at the common corner is (-1,-1,3)/sqrt(11).
 * Scenarios:
 * 1. Zero and return preserve the exact ancestral field; genuine center detail
 *    includes the unchanged raw neighbor rather than a feature-only star.
 * 2. A common rigid rotation is covariant and uniform similarity preserves
 *    the resulting normal direction under the explicit transverse convention.
 * 3. Missing or stale reference, malformed cells and singular current/reference
 *    refuse; recovery and caller-owned source/coordinate preservation remain.
 */
export const test_human_person_normal_transport = (): void => {
  const source = {
    generation: "analytic-roof-with-neighbor",
    originalVertices: 5,
    parentTriangles: [0, 1, 2, 0, 3, 4],
    intersections: [],
    refinements: [{ parent: 0, coordinates: [0.25, 0.25] as const }],
  };
  const subdivisions = [{ parent: 0, triangles: [0, 1, 5, 1, 2, 5, 2, 0, 5], domains: [0, 0, 0, 0, 0, 0, 0, 0, 0] }];
  const face: { positions: number[]; indices: number[]; sourcePartition: IAutoMovieHumanBasisSourcePartition } = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0, 0.5, 0.5, 0],
    indices: [0, 1, 3, 1, 2, 3, 2, 0, 3],
    sourcePartition: {
      ...source, samples: [0, 1, 2, 5], parents: [0, 0, 0],
      normalTransport: {
        subdivisions, cells: [0, 1, 2], bindings: [
          { parent: 0, cell: 0, coordinates: [0, 0] },
          { parent: 0, cell: 0, coordinates: [1, 0] },
          { parent: 0, cell: 1, coordinates: [1, 0] },
          { parent: 0, cell: 0, coordinates: [0, 1] },
        ],
      },
    },
  };
  const body: typeof face = {
    positions: [0, 0, 0, -2, 0, 0, 0, -2, 0], indices: [0, 1, 2],
    sourcePartition: {
      ...source, samples: [0, 3, 4], parents: [1],
      normalTransport: { subdivisions, cells: [0], bindings: [{ parent: 1 }, { parent: 1 }, { parent: 1 }] },
    },
  };
  const fixture = { face, body };
  const sourceBefore = JSON.stringify(fixture);
  const evaluate = createHumanPersonSourceNormals(fixture)!;
  const current = { face: face.positions, body: body.positions, bodyIndices: body.indices };
  const reference = { ...current, generation: source.generation };
  const legacy = createHumanPersonSourceNormals({
    face: { ...face, sourcePartition: { ...face.sourcePartition, normalTransport: undefined } },
    body: { ...body, sourcePartition: { ...body.sourcePartition, normalTransport: undefined } },
  })!;
  const zero = evaluate({ ...current, reference });
  TestValidator.equals("zero is exact ancestral field", zero, legacy(current));
  const roof = [...face.positions];
  roof[11] = 1;
  const detail = evaluate({ ...current, face: roof, reference });
  const expected = [-1, -1, 3].map((value) => value / Math.sqrt(11));
  TestValidator.predicate("fixed unchanged neighbor contributes its full area", detail.slice(0, 3).every((value, at) => nclose(value, expected[at], 1e-12)));
  TestValidator.predicate("shared corner consumes identical star", detail.slice(0, 3).every((value, at) => nclose(value, detail[12 + at], 1e-12)));
  TestValidator.predicate("genuine center detail changes the source field", detail.some((value, at) => !nclose(value, zero[at], 1e-12)));
  const rotate = (values: readonly number[]): number[] => values.map((value, at) => at % 3 === 0 ? value : at % 3 === 1 ? -values[at + 1] : values[at - 1]);
  const rotated = evaluate({
    face: rotate(roof), body: rotate(body.positions), bodyIndices: body.indices,
    reference: { ...reference, face: rotate(face.positions), body: rotate(body.positions) },
  });
  TestValidator.predicate("common rigid rotation is covariant", rotated.every((value, at) => nclose(value, rotate(detail)[at], 1e-12)));
  const scaled = evaluate({ ...current, face: roof.map((value) => value * 2), body: body.positions.map((value) => value * 2), reference });
  TestValidator.predicate("similarity keeps detail normals", scaled.every((value, at) => nclose(value, detail[at], 1e-12)));
  TestValidator.predicate("missing reference refuses", throwsError(() => evaluate(current), "matching reference"));
  TestValidator.predicate("stale reference refuses", throwsError(() => evaluate({ ...current, reference: { ...reference, generation: "stale" } }), "matching reference"));
  const collapsed = face.positions.map(() => 0);
  TestValidator.predicate("singular current refuses", throwsError(() => evaluate({ ...current, face: collapsed, reference }), "zero performed"));
  TestValidator.predicate("singular reference refuses", throwsError(() => evaluate({ ...current, reference: { ...reference, face: collapsed } }), "zero performed"));
  TestValidator.predicate("one-sided transport refuses", throwsError(() => createHumanPersonSourceNormals({ face, body: { ...body, sourcePartition: { ...body.sourcePartition, normalTransport: undefined } } }), "both compiled halves"));
  const malformed = { ...face, sourcePartition: { ...face.sourcePartition, normalTransport: { ...face.sourcePartition.normalTransport!, cells: [0, 1, 99] } } };
  TestValidator.predicate("absent source cell refuses", throwsError(() => createHumanPersonSourceNormals({ face: malformed, body }), "absent local source cell"));
  TestValidator.equals("return and recovery are exact", evaluate({ ...current, reference }), zero);
  TestValidator.equals("caller geometry and lineage remain unchanged", JSON.stringify(fixture), sourceBefore);
  const tilted = humanSourcePartitionFixture();
  tilted.face.positions[11] = 0.5;
  tilted.body.positions[14] = 1;
  tilted.body.positions[17] = 0.5;
  tilted.face.sourcePartition = { ...tilted.face.sourcePartition, normalTransport: {
    subdivisions: [], cells: [0, 0],
    bindings: [0, 0, 0, 1].map((parent) => ({ parent })),
  } };
  tilted.body.sourcePartition = { ...tilted.body.sourcePartition, normalTransport: {
    subdivisions: [], cells: [0, 0, 0, 0],
    bindings: [0, 0, 0, 0, 1, 1].map((parent) => ({ parent })),
  } };
  const tiltedInput = { face: tilted.face.positions, body: tilted.body.positions, bodyIndices: tilted.body.indices };
  const tiltedReference = { ...tiltedInput, generation: tilted.face.sourcePartition.generation };
  const tiltedEvaluate = createHumanPersonSourceNormals(tilted)!;
  const tiltedZero = tiltedEvaluate({ ...tiltedInput, reference: tiltedReference });
  const tiltedScale = tiltedEvaluate({ ...tiltedInput,
    face: tiltedInput.face.map((value) => value * 2),
    body: tiltedInput.body.map((value) => value * 2), reference: tiltedReference,
  });
  TestValidator.predicate("transverse extension preserves tilted ancestral normals under similarity", tiltedScale.every((value, at) => nclose(value, tiltedZero[at], 1e-12)));
  const empty = { ...face, positions: [...face.positions, 9, 9, 9], sourcePartition: {
    ...face.sourcePartition, samples: [...face.sourcePartition.samples, 0], normalTransport: {
      ...face.sourcePartition.normalTransport!, bindings: [...face.sourcePartition.normalTransport!.bindings, null],
    },
  } };
  const unused = createHumanPersonSourceNormals({ face: empty, body })!({ ...current, face: [...roof, 9, 9, 9], reference: { ...reference, face: empty.positions } });
  TestValidator.equals("unused source vertex remains zero in transported field", unused.slice(12, 15), [0, 0, 0]);
  const refuse = (title: string, patch: Partial<IAutoMovieHumanBasisNormalTransport>, message: string): void => {
    const invalid = { ...face, sourcePartition: { ...face.sourcePartition,
      normalTransport: { ...face.sourcePartition.normalTransport!, ...patch },
    } };
    TestValidator.predicate(title, throwsError(() => createHumanPersonSourceNormals({ face: invalid, body }), message));
    TestValidator.equals(title + " recovery", evaluate({ ...current, reference }), zero);
  };
  refuse("sparse subdivisions refuse", { subdivisions: new Array(1) }, "dense ordered");
  refuse("absent parent refuses", { subdivisions: [{ ...subdivisions[0], parent: 99 }] }, "dense ordered");
  refuse("duplicate parents refuse", { subdivisions: [subdivisions[0], subdivisions[0]] }, "dense ordered");
  refuse("empty source cells refuse", { subdivisions: [{ ...subdivisions[0], triangles: [], domains: [] }] }, "dense ordered");
  refuse("domain population refuses", { subdivisions: [{ ...subdivisions[0], domains: [0] }] }, "dense ordered");
  refuse("nonfinite domains refuse", { subdivisions: [{ ...subdivisions[0], domains: subdivisions[0].domains.map(() => NaN) }] }, "dense ordered");
  refuse("unknown sample refuses", { subdivisions: [{ ...subdivisions[0], triangles: [0, 1, 99], domains: [0, 0, 0] }] }, "dense ordered");
  refuse("mismatching halves refuse", { subdivisions: [] }, "subdivisions disagree");
  refuse("missing emitted population refuses", { cells: [] }, "populations");
  refuse("missing binding population refuses", { bindings: [] }, "populations");
  refuse("sparse bindings refuse", { bindings: new Array(4) }, "dense");
  refuse("null used binding refuses", { bindings: [null, ...face.sourcePartition.normalTransport!.bindings.slice(1)] }, "used vertex");
  refuse("absent bound parent refuses", { bindings: [{ parent: 99 }, ...face.sourcePartition.normalTransport!.bindings.slice(1)] }, "used vertex");
  refuse("raw binding on feature refuses", { bindings: [{ parent: 0 }, ...face.sourcePartition.normalTransport!.bindings.slice(1)] }, "incident source cell");
  refuse("nonincident feature cell refuses", { bindings: [{ parent: 0, cell: 1, coordinates: [0, 0] }, ...face.sourcePartition.normalTransport!.bindings.slice(1)] }, "incident source cell");
  refuse("invalid source chart refuses", { bindings: [{ parent: 0, cell: 0, coordinates: [-1, 0] }, ...face.sourcePartition.normalTransport!.bindings.slice(1)] }, "closed chart");
  refuse("wrong canonical chart refuses", { bindings: [{ parent: 0, cell: 0, coordinates: [1, 0] }, ...face.sourcePartition.normalTransport!.bindings.slice(1)] }, "canonical geometric sample");
  const malformedChart = { parent: 0, cell: 0, coordinates: undefined } as unknown as IAutoMovieHumanBasisNormalTransport["bindings"][number];
  refuse("missing feature chart refuses at its owner", { bindings: [malformedChart, ...face.sourcePartition.normalTransport!.bindings.slice(1)] }, "two-coordinate chart");
  const rawChart = { parent: 1, coordinates: [0, 0] };
  TestValidator.predicate("raw binding cannot replace the ordered source stencil", throwsError(() => createHumanPersonSourceNormals({ face, body: { ...body, sourcePartition: { ...body.sourcePartition, normalTransport: {
    ...body.sourcePartition.normalTransport!, bindings: [rawChart, ...body.sourcePartition.normalTransport!.bindings.slice(1)],
  } } } }), "incident implicit cell"));
};
