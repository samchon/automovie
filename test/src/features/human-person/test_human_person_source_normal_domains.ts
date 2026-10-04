import type { IAutoMovieHumanBasisSourcePartition } from "@automovie/human/common/basis/IAutoMovieHumanBasisSourcePartition";
import { createHumanPersonSourceNormals } from "@automovie/human/human/build/createHumanPersonSourceNormals";
import { validateHumanPersonSourcePartitions } from "@automovie/human/human/build/validateHumanPersonSourcePartitions";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Opposed source sheets share geometry while selecting distinct corner stars.
 * Independent barycentric fans preserve each complete parent. Geometry charts,
 * normal incidence and current zero-field admission remain separate checks.
 * Scenarios:
 * 1. Opposed affine fans keep separate outward stars and owned records.
 * 2. Invalid coordinates, domains, parent selections and mismatched tables refuse.
 * 3. Unselected crease ambiguity and required zero stars refuse.
 * 4. Unique incidence and unused aliases stay valid; fresh valid input recovers.
 */
export const test_human_person_source_normal_domains = (): void => {
  const fixture = () => {
    const common = {
      generation: "opposed-sheet-source",
      originalVertices: 3,
      parentTriangles: [0, 1, 2, 0, 2, 1],
      intersections: [],
      refinements: [
        { parent: 0, coordinates: [0.25, 0.5] as const },
        { parent: 1, coordinates: [0.5, 0.25] as const },
      ],
      parentNormalDomains: [1, 1, 1, 2, 2, 2],
    };
    const faceSource: IAutoMovieHumanBasisSourcePartition = {
      ...common,
      samples: [0, 1, 2, 0, 2, 1, 3, 4],
      parents: [0, 0, 0, 1, 1, 1],
      normalParents: [0, 0, 0, 1, 1, 1, 0, 1],
    };
    return {
      face: {
        positions: [
          0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0.5, 1, 0, 0.5,
          1, 0,
        ],
        indices: [0, 1, 6, 1, 2, 6, 2, 0, 6, 3, 4, 7, 4, 5, 7, 5, 3, 7],
        sourcePartition: faceSource,
      },
      body: {
        positions: [] as number[],
        indices: [] as number[],
        sourcePartition: {
          ...common,
          samples: [],
          parents: [],
          normalParents: [],
        } as IAutoMovieHumanBasisSourcePartition,
      },
    };
  };
  const pair = fixture();
  const plan = validateHumanPersonSourcePartitions(pair)!;
  TestValidator.predicate(
    "refinements and domains are copied",
    plan.face.refinements !== pair.face.sourcePartition.refinements &&
      plan.face.parentNormalDomains !==
        pair.face.sourcePartition.parentNormalDomains &&
      plan.face.normalParents !== pair.face.sourcePartition.normalParents,
  );
  const evaluate = (p: ReturnType<typeof fixture>) =>
    createHumanPersonSourceNormals(p)!({
      face: p.face.positions,
      body: p.body.positions,
      bodyIndices: p.body.indices,
    });
  const normals = evaluate(pair);
  const near = (actual: number[], expected: number[]): boolean =>
    actual.length === expected.length &&
    actual.every((value, at) => nclose(value, expected[at], 1e-12));
  for (const vertex of [0, 1, 2, 6])
    TestValidator.predicate(
      "upper source star remains outward",
      near(normals.slice(vertex * 3, vertex * 3 + 3), [0, 0, 1]),
    );
  for (const vertex of [3, 4, 5, 7])
    TestValidator.predicate(
      "lower alias has independent incidence",
      near(normals.slice(vertex * 3, vertex * 3 + 3), [0, 0, -1]),
    );
  const implicit = fixture();
  implicit.face.sourcePartition = {
    ...implicit.face.sourcePartition,
    normalParents: undefined,
  };
  TestValidator.predicate(
    "unique incident domains need no selector",
    near(evaluate(implicit), normals),
  );
  const unused = fixture();
  unused.face.positions.push(0, 0, 0);
  unused.face.sourcePartition = {
    ...unused.face.sourcePartition,
    samples: [...unused.face.sourcePartition.samples, 0],
    normalParents: [...unused.face.sourcePartition.normalParents!, 1],
  };
  TestValidator.predicate(
    "unused normal binding is not a ghost field",
    near(evaluate(unused), [...normals, 0, 0, 0]),
  );
  const edgeSource = {
    generation: "inactive-anchor-star",
    originalVertices: 4,
    parentTriangles: [0, 1, 2, 0, 3, 1],
    intersections: [],
    refinements: [{ parent: 0, coordinates: [0.5, 0.5] as const }],
    parentNormalDomains: [1, 1, 1, 2, 2, 2],
  };
  const edgeFace = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 1, 1, 0],
    indices: [0, 1, 4, 0, 4, 2, 0, 3, 1],
    sourcePartition: {
      ...edgeSource,
      samples: [0, 1, 2, 3, 4],
      parents: [0, 0, 1],
      normalParents: [1, 0, 0, 1, 0],
    },
  };
  const edgeBody = {
    positions: [] as number[],
    indices: [] as number[],
    sourcePartition: {
      ...edgeSource,
      samples: [],
      parents: [],
      normalParents: [],
    },
  };
  const edgeNormals = createHumanPersonSourceNormals({
    face: edgeFace,
    body: edgeBody,
  })!({ face: edgeFace.positions, body: [], bodyIndices: [] });
  TestValidator.predicate(
    "opposite-edge interpolation never requires its inactive anchor star",
    near(edgeNormals.slice(12, 15), [0, 0, 1]),
  );
  const negative = (
    record: Partial<IAutoMovieHumanBasisSourcePartition>,
    reason: string,
  ): void => {
    const p = fixture();
    p.face.sourcePartition = { ...p.face.sourcePartition, ...record };
    TestValidator.predicate(
      reason,
      throwsError(() => evaluate(p), reason),
    );
  };
  for (const coordinates of [
    [-1, 1],
    [NaN, 0],
    [1],
    [0.75, 0.75],
    [0.5, 0.5, 1],
  ] as readonly number[][])
    negative(
      {
        refinements: [
          { parent: 0, coordinates: coordinates as [number, number] },
        ],
      },
      "coordinates",
    );
  negative(
    { refinements: [{ parent: 2, coordinates: [0, 0] }] },
    "parent-bound affine coordinates",
  );
  const sparse = new Array<{
    parent: number;
    coordinates: readonly [number, number];
  }>(2);
  negative({ refinements: sparse }, "explicit affine coordinates");
  const old = Object.assign(
    { parent: 0, coordinates: [0.25, 0.5] as const },
    { barycentric: [0.25, 0.25, 0.5] },
  );
  negative(
    { refinements: [old, fixture().face.sourcePartition.refinements![1]] },
    "barycentric payloads",
  );
  for (const parentNormalDomains of [
    [1],
    [-1, 1, 1, 2, 2, 2],
    [0.5, 1, 1, 2, 2, 2],
    new Array<number>(6),
  ])
    negative({ parentNormalDomains }, "every parent corner");
  for (const normalParents of [
    [0],
    [2, 0, 0, 1, 1, 1, 0, 1],
    new Array<number>(8),
  ])
    negative({ normalParents }, "vertex population");
  negative(
    { normalParents: [1, 0, 0, 1, 1, 1, 0, 1] },
    "actual incident source preimage",
  );
  negative(
    {
      refinements: [
        { parent: 0, coordinates: [0.25, 0.25] },
        { parent: 1, coordinates: [0.5, 0.25] },
      ],
    },
    "incompatible parent trees",
  );
  negative(
    {
      refinements: [
        ...fixture().face.sourcePartition.refinements!,
        { parent: 0, coordinates: [0, 0] },
      ],
    },
    "incompatible parent trees",
  );
  negative(
    {
      refinements: [
        { parent: 1, coordinates: [0.25, 0.5] },
        { parent: 1, coordinates: [0.5, 0.25] },
      ],
    },
    "incompatible parent trees",
  );
  negative(
    { parentNormalDomains: [3, 1, 1, 2, 2, 2] },
    "incompatible parent trees",
  );
  const zero = fixture();
  for (const side of [zero.face, zero.body])
    side.sourcePartition = {
      ...side.sourcePartition,
      parentNormalDomains: undefined,
    };
  TestValidator.predicate(
    "required zero smooth stars refuse",
    throwsError(() => evaluate(zero), "nonzero used normal"),
  );
  const ambiguous = fixture();
  ambiguous.face.indices = ambiguous.face.indices.map((id) =>
    id === 3 ? 0 : id,
  );
  ambiguous.face.sourcePartition = {
    ...ambiguous.face.sourcePartition,
    normalParents: undefined,
  };
  TestValidator.predicate(
    "unselected crease incidence refuses",
    throwsError(() => evaluate(ambiguous), "ambiguous"),
  );
  TestValidator.predicate(
    "valid crease recovers deterministically",
    near(evaluate(fixture()), normals),
  );
};
