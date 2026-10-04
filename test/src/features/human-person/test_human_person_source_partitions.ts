import { validateHumanPersonSourcePartitions } from "@automovie/human/human/build/validateHumanPersonSourcePartitions";
import { createHumanPersonSourceNormals } from "@automovie/human/human/build/createHumanPersonSourceNormals";
import { TestValidator } from "@nestia/e2e";

import { humanSourcePartitionFixture } from "../internal/humanSourcePartitionFixture";
import { throwsError } from "../internal/predicates";

/**
 * Two positive complementary charts cover each original oriented triangle.
 * Source labels cannot replace the tree, cut identity, domains or coverage.
 *
 * Scenarios:
 * 1. A valid partition is copied; legacy absence remains distinct from a
 *    missing half. Mismatched trees and ordered cut records refuse.
 * 2. Noninteger/out-of-range domains, sparse arrays, malformed parent triples,
 *    stencil endpoints and map populations refuse beside the valid fixture.
 * 3. Reversed, zero, duplicate and uncovered cells refuse by the source chart.
 *    Overlapping outer intervals and unrepresentable winding also refuse.
 * 4. An empty half may accompany a complete source; a fresh valid pair recovers.
 * 5. Sparse namespaces above JavaScript array length and up to safe integer
 *    count retain referenced IDs, real normal consumption and ordered virtual
 *    offsets without extent allocation. Lazy lookup captures caller metadata;
 *    invalid IDs and unsafe virtual count overflow refuse beside valid input.
 */
export const test_human_person_source_partitions = (): void => {
  const fixture = humanSourcePartitionFixture();
  const valid = validateHumanPersonSourcePartitions(fixture)!;
  TestValidator.equals(
    "complete source charts are copied",
    valid.face.samples,
    [4, 1, 5, 6],
  );
  TestValidator.predicate(
    "compiled records do not alias caller arrays",
    valid.face.samples !== fixture.face.sourcePartition.samples &&
      valid.face.intersections !== fixture.face.sourcePartition.intersections,
  );
  TestValidator.equals(
    "legacy absence selects no source plan",
    validateHumanPersonSourcePartitions({
      face: { ...fixture.face, sourcePartition: undefined },
      body: { ...fixture.body, sourcePartition: undefined },
    }),
    undefined,
  );
  TestValidator.predicate(
    "one missing half is a partial generation",
    throwsError(
      () =>
        validateHumanPersonSourcePartitions({
          face: fixture.face,
          body: { ...fixture.body, sourcePartition: undefined },
        }),
      "both compiled halves",
    ),
  );
  TestValidator.predicate(
    "the opposite missing half also refuses",
    throwsError(
      () =>
        validateHumanPersonSourcePartitions({
          face: { ...fixture.face, sourcePartition: undefined },
          body: fixture.body,
        }),
      "both compiled halves",
    ),
  );
  const fault = (
    mutate: (pair: ReturnType<typeof humanSourcePartitionFixture>) => void,
    message: string,
  ): void => {
    const pair = humanSourcePartitionFixture();
    mutate(pair);
    TestValidator.predicate(
      message,
      throwsError(() => validateHumanPersonSourcePartitions(pair), message),
    );
  };
  for (const generation of ["", "  "])
    fault((p) => {
      p.face.sourcePartition = { ...p.face.sourcePartition, generation };
    }, "finite source domain");
  for (const originalVertices of [
    2,
    4.5,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER,
  ])
    fault((p) => {
      p.face.sourcePartition = { ...p.face.sourcePartition, originalVertices };
    }, "finite source domain");
  for (const parentTriangles of [[], [0, 1]])
    fault((p) => {
      p.face.sourcePartition = { ...p.face.sourcePartition, parentTriangles };
    }, "finite source domain");
  for (const parentTriangles of [
    [0, 0, 2, 0, 3, 1],
    [0, 1, 4, 0, 3, 1],
    [0, Number.NaN, 2, 0, 3, 1],
    new Array<number>(6),
  ])
    fault((p) => {
      p.face.sourcePartition = { ...p.face.sourcePartition, parentTriangles };
    }, "distinct original IDs");
  for (const point of [
    { a: -1, b: 1, t: 0.5 },
    { a: 0, b: 4, t: 0.5 },
    { a: 1, b: 1, t: 0.5 },
    { a: 0, b: 1, t: Number.NaN },
    { a: 0, b: 1, t: 0 },
    { a: 0, b: 1, t: 1 },
  ])
    fault((p) => {
      p.face.sourcePartition = {
        ...p.face.sourcePartition,
        intersections: [
          point,
          ...p.face.sourcePartition.intersections.slice(1),
        ],
      };
    }, "strict finite");
  fault((p) => {
    p.face.sourcePartition = {
      ...p.face.sourcePartition,
      intersections: new Array(3),
    };
  }, "strict finite");
  fault((p) => {
    p.face.positions.pop();
  }, "cell maps");
  fault((p) => {
    p.face.indices.pop();
  }, "cell maps");
  fault((p) => {
    p.face.sourcePartition = { ...p.face.sourcePartition, samples: [] };
  }, "cell maps");
  fault((p) => {
    p.face.sourcePartition = { ...p.face.sourcePartition, parents: [] };
  }, "cell maps");
  for (const sample of [-1, 7, 4.5])
    fault((p) => {
      p.face.sourcePartition = {
        ...p.face.sourcePartition,
        samples: [sample, 1, 5, 6],
      };
    }, "cell maps");
  fault((p) => {
    p.face.sourcePartition = {
      ...p.face.sourcePartition,
      samples: new Array<number>(4),
    };
  }, "cell maps");
  fault((p) => {
    p.face.sourcePartition = { ...p.face.sourcePartition, parents: [-1, 1] };
  }, "cell maps");
  fault((p) => {
    p.face.indices[0] = 99;
  }, "cell maps");
  fault((p) => {
    p.body.sourcePartition = {
      ...p.body.sourcePartition,
      generation: "another",
    };
  }, "incompatible");
  fault((p) => {
    p.body.sourcePartition = { ...p.body.sourcePartition, originalVertices: 5 };
  }, "incompatible");
  fault((p) => {
    p.body.sourcePartition = {
      ...p.body.sourcePartition,
      parentTriangles: [...p.body.sourcePartition.parentTriangles, 0, 2, 3],
    };
  }, "incompatible");
  fault((p) => {
    p.body.sourcePartition = {
      ...p.body.sourcePartition,
      parentTriangles: [0, 2, 1, 0, 3, 1],
    };
  }, "incompatible");
  fault((p) => {
    p.body.sourcePartition = {
      ...p.body.sourcePartition,
      intersections: [
        ...p.body.sourcePartition.intersections,
        { a: 0, b: 2, t: 0.5 },
      ],
    };
  }, "incompatible");
  for (const point of [
    { a: 1, b: 0, t: 0.5 },
    { a: 0, b: 2, t: 0.5 },
    { a: 0, b: 1, t: 0.25 },
  ])
    fault((p) => {
      p.body.sourcePartition = {
        ...p.body.sourcePartition,
        intersections: [
          point,
          ...p.body.sourcePartition.intersections.slice(1),
        ],
      };
    }, "incompatible");
  fault((p) => {
    p.face.sourcePartition = { ...p.face.sourcePartition, parents: [1, 1] };
  }, "leaves its declared");
  fault((p) => {
    p.face.indices.splice(0, 3, 2, 1, 0);
  }, "positive nonzero");
  fault((p) => {
    p.face.indices.splice(0, 3, 0, 0, 2);
  }, "positive nonzero");
  fault((p) => {
    p.body.indices.push(0, 1, 2);
    p.body.sourcePartition = {
      ...p.body.sourcePartition,
      parents: [...p.body.sourcePartition.parents, 0],
    };
  }, "cancel once");
  fault((p) => {
    p.body.indices.push(1, 2, 0);
    p.body.sourcePartition = {
      ...p.body.sourcePartition,
      parents: [...p.body.sourcePartition.parents, 0],
    };
  }, "cancel once");
  fault((p) => {
    p.body.indices.splice(0, 3);
    p.body.sourcePartition = {
      ...p.body.sourcePartition,
      parents: p.body.sourcePartition.parents.slice(1),
    };
  }, "uncovered interior edge");
  fault((p) => {
    const parentTriangles = [
      ...p.face.sourcePartition.parentTriangles,
      0,
      2,
      3,
    ];
    p.face.sourcePartition = { ...p.face.sourcePartition, parentTriangles };
    p.body.sourcePartition = { ...p.body.sourcePartition, parentTriangles };
  }, "cover every original");
  fault((p) => {
    const intersections = [
      { a: 0, b: 1, t: 2 ** -55 },
      ...p.face.sourcePartition.intersections.slice(1),
    ];
    p.face.sourcePartition = { ...p.face.sourcePartition, intersections };
    p.body.sourcePartition = { ...p.body.sourcePartition, intersections };
  }, "original winding");
  fault((p) => {
    const intersections = [
      ...p.face.sourcePartition.intersections,
      { a: 0, b: 1, t: 0.5 },
      { a: 1, b: 2, t: 0.5 },
      { a: 2, b: 0, t: 0.5 },
    ];
    p.face.positions.push(0, 0, 0, 0, 2, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0);
    p.face.indices.push(4, 6, 8, 6, 1, 7, 8, 7, 5, 6, 7, 8);
    p.face.sourcePartition = {
      ...p.face.sourcePartition,
      intersections,
      samples: [...p.face.sourcePartition.samples, 0, 2, 7, 8, 9],
      parents: [...p.face.sourcePartition.parents, 0, 0, 0, 0],
    };
    p.body.sourcePartition = { ...p.body.sourcePartition, intersections };
  }, "gap or overlapping");
  const whole = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    sourcePartition: {
      generation: "one-plane",
      originalVertices: 3,
      parentTriangles: [0, 1, 2],
      intersections: [],
      samples: [0, 1, 2],
      parents: [0],
    },
  };
  TestValidator.predicate(
    "an explicitly empty complementary half is valid",
    validateHumanPersonSourcePartitions({
      face: {
        positions: [],
        indices: [],
        sourcePartition: { ...whole.sourcePartition, samples: [], parents: [] },
      },
      body: whole,
    }) !== undefined,
  );
  TestValidator.predicate(
    "fresh valid input recovers after every refusal",
    validateHumanPersonSourcePartitions(humanSourcePartitionFixture()) !==
      undefined,
  );
  const sparse = (count: number) => {
    const original = [count - 3, count - 2, count - 1];
    const source = { generation: "wide-sparse-plane", originalVertices: count,
      parentTriangles: original, intersections: [] as { a: number; b: number; t: number }[],
      refinements: [] as { parent: number; coordinates: [number, number] }[],
    };
    return {
      face: { positions: [0, 0, 0, 2, 0, 0, 0, 2, 0], indices: [0, 1, 2],
        sourcePartition: { ...source, samples: original, parents: [0], normalTransport: {
          subdivisions: [], cells: [0], bindings: [{ parent: 0 }, { parent: 0 }, { parent: 0 }],
        } },
      },
      body: { positions: [] as number[], indices: [] as number[], sourcePartition: {
        ...source, samples: [] as number[], parents: [] as number[], normalTransport: { subdivisions: [], cells: [], bindings: [] },
      } },
    };
  };
  for (const count of [3, 2 ** 32, Number.MAX_SAFE_INTEGER]) {
    const pair = sparse(count);
    const before = JSON.stringify(pair);
    const plan = validateHumanPersonSourcePartitions(pair)!;
    TestValidator.equals("namespace extent remains metadata", plan.sampleCount, count);
    const firstChart = plan.chart(count - 1);
    TestValidator.equals("high referenced original IDs are preserved", firstChart.originals, [count - 1, count - 1, count - 1]);
    TestValidator.predicate("read-only original charts are memoized", plan.chart(count - 1) === firstChart);
    const input = { face: pair.face.positions, body: [], bodyIndices: [] };
    TestValidator.equals("real transport consumer accepts sparse wide source", createHumanPersonSourceNormals(pair)!({
      ...input, reference: { ...input, generation: pair.face.sourcePartition.generation },
    }), [0, 0, 1, 0, 0, 1, 0, 0, 1]);
    TestValidator.equals("namespace compilation never mutates caller", JSON.stringify(pair), before);
    for (const bad of [-1, 0.5, NaN, Infinity, count])
      TestValidator.predicate("invalid lazy chart ID refuses", throwsError(() => plan.chart(bad), "captured canonical domain"));
    TestValidator.predicate("invalid lazy preimage ID refuses", throwsError(() => plan.preimage(count), "captured canonical domain"));
  }
  const lazy = sparse(2 ** 32);
  const base = lazy.face.sourcePartition.originalVertices;
  lazy.face.sourcePartition.intersections.push({ a: base - 3, b: base - 2, t: 0.25 });
  lazy.face.sourcePartition.refinements.push({ parent: 0, coordinates: [0.25, 0.5] });
  const lazyPlan = validateHumanPersonSourcePartitions(lazy)!;
  lazy.face.sourcePartition.parentTriangles[0] = 0;
  lazy.face.sourcePartition.intersections[0].t = 0.75;
  lazy.face.sourcePartition.refinements[0].coordinates[0] = 0.5;
  TestValidator.equals("uncached cut retains captured ordered coordinates", lazyPlan.chart(base).coordinates, [0.25, 0]);
  TestValidator.equals("uncached cut retains captured endpoints", lazyPlan.chart(base).originals, [base - 3, base - 2, base - 3]);
  TestValidator.equals("uncached refinement retains captured parent and coordinates", lazyPlan.chart(base + 1), {
    originals: [base - 3, base - 2, base - 1], coordinates: [0.25, 0.5],
  });
  const firstPreimage = lazyPlan.preimage(base);
  TestValidator.equals("lazy cut preimage retains the exact stencil", firstPreimage, [{ id: base - 3, weight: 0.75 }, { id: base - 2, weight: 0.25 }]);
  TestValidator.predicate("read-only preimages are memoized", lazyPlan.preimage(base) === firstPreimage);
  TestValidator.equals("refined wide offsets retain source weights", lazyPlan.preimage(base + 1), [{ id: base - 3, weight: 0.25 }, { id: base - 2, weight: 0.25 }, { id: base - 1, weight: 0.5 }]);
  const overflow = sparse(Number.MAX_SAFE_INTEGER);
  overflow.face.sourcePartition.intersections.push({ a: 0, b: 1, t: 0.5 });
  TestValidator.predicate("virtual offset beyond safe namespace refuses", throwsError(() => validateHumanPersonSourcePartitions(overflow), "finite source domain"));
};
