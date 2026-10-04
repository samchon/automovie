import { createHumanPersonSourceNormals } from "@automovie/human/human/build/createHumanPersonSourceNormals";
import { TestValidator } from "@nestia/e2e";

import { humanSourcePartitionFixture } from "../internal/humanSourcePartitionFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Original-parent shading survives complementary clipping of a nonplanar star.
 * The two parent vectors are independently (0,0,4) and (0,4,0). Their common
 * source vertex has a 45-degree normal, so the halfway cut toward the +Z
 * vertex has a 22.5-degree normal instead of the clipped-cell +Z normal.
 *
 * Scenarios:
 * 1. The plane/nonplanar source field matches the half-angle oracle and supplies
 *    exactly the same sample normal to both partitions, with owned outputs.
 * 2. A common quarter turn and translation evaluate the performed field rather
 *    than retaining neutral normals. Unused vertices retain zero.
 * 3. Missing population, nonfinite/unrepresentable coordinates, disagreeing
 *    shared samples and zero cell/vertex fields refuse. A valid call recovers.
 * 4. Both absent records preserve the legacy choice; a one-sided record refuses.
 */
export const test_human_person_source_normals = (): void => {
  const fixture = humanSourcePartitionFixture();
  const evaluate = createHumanPersonSourceNormals(fixture)!;
  const input = {
    face: fixture.face.positions,
    body: fixture.body.positions,
    bodyIndices: fixture.body.indices,
  };
  const normal = evaluate(input);
  const expected = [0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)];
  TestValidator.predicate(
    "source midpoint uses the original nonplanar vertex star",
    normal.slice(6, 9).every((value, i) => nclose(value, expected[i], 1e-12)),
  );
  TestValidator.predicate(
    "the two compiled halves share one normal sample",
    normal
      .slice(6, 9)
      .every((value, i) => nclose(value, normal[18 + i], 1e-12)),
  );
  normal[0] = 999;
  TestValidator.predicate(
    "returned normal arrays are owned",
    nclose(evaluate(input)[0], 0, 1e-12),
  );
  const rotate = (values: readonly number[]): number[] =>
    values.map((_, i) => {
      const at = i - (i % 3);
      return i % 3 === 0
        ? 3 - values[at + 1]
        : i % 3 === 1
          ? 4 + values[at]
          : 5 + values[at + 2];
    });
  const posed = evaluate({
    ...input,
    face: rotate(input.face),
    body: rotate(input.body),
  });
  TestValidator.predicate(
    "current performed normals rotate with the source",
    posed
      .slice(6, 9)
      .every((value, i) =>
        nclose(value, [-expected[1], 0, expected[2]][i], 1e-12),
      ),
  );
  const unused = humanSourcePartitionFixture();
  unused.face.positions.push(9, 9, 9);
  unused.face.sourcePartition = {
    ...unused.face.sourcePartition,
    samples: [...unused.face.sourcePartition.samples, 0],
  };
  const unusedNormals = createHumanPersonSourceNormals(unused)!({
    face: unused.face.positions,
    body: unused.body.positions,
    bodyIndices: unused.body.indices,
  });
  TestValidator.equals(
    "unused surface vertex has no invented normal",
    unusedNormals.slice(12, 15),
    [0, 0, 0],
  );
  TestValidator.predicate(
    "missing performed cells refuse",
    throwsError(() => evaluate({ ...input, bodyIndices: [] }), "population"),
  );
  TestValidator.predicate(
    "changed vertex population refuses",
    throwsError(() => evaluate({ ...input, face: [] }), "population"),
  );
  TestValidator.predicate(
    "changed body vertex population refuses",
    throwsError(() => evaluate({ ...input, body: [] }), "population"),
  );
  TestValidator.predicate(
    "a sparse performed topology is not a complete source population",
    throwsError(
      () =>
        evaluate({
          ...input,
          bodyIndices: new Array<number>(input.bodyIndices.length),
        }),
      "population",
    ),
  );
  TestValidator.predicate(
    "reordered cells refuse",
    throwsError(
      () =>
        evaluate({ ...input, bodyIndices: [...input.bodyIndices].reverse() }),
      "population",
    ),
  );
  const nonfinite = [...input.face];
  nonfinite[0] = Number.NaN;
  TestValidator.predicate(
    "nonfinite positions refuse",
    throwsError(
      () => evaluate({ ...input, face: nonfinite }),
      "finite performed",
    ),
  );
  TestValidator.predicate(
    "sparse performed coordinates refuse",
    throwsError(
      () => evaluate({ ...input, face: new Array<number>(input.face.length) }),
      "finite performed",
    ),
  );
  const huge = input.face.map((value) => value + 1e39);
  TestValidator.predicate(
    "unrepresentable sample refuses",
    throwsError(() => evaluate({ ...input, face: huge }), "Float32"),
  );
  const moved = [...input.body];
  moved[3] = 1.1;
  TestValidator.predicate(
    "source identity alone cannot certify shared geometry",
    throwsError(() => evaluate({ ...input, body: moved }), "shared identity"),
  );
  const folded = [...input.body];
  folded.splice(0, 3, 2, 2, 0);
  TestValidator.predicate(
    "smooth parent normals cannot hide an opposing performed cell",
    throwsError(
      () => evaluate({ ...input, body: folded }),
      "opposes its complete parent",
    ),
  );
  const collapsed = input.face.map(() => 0);
  TestValidator.predicate(
    "zero performed cell refuses",
    throwsError(
      () => evaluate({ ...input, face: collapsed }),
      "zero performed",
    ),
  );
  const cancel = humanSourcePartitionFixture();
  cancel.face.positions.splice(9, 3, 1, 1, 0);
  cancel.body.positions.splice(12, 6, 0, 2, 0, 1, 1, 0);
  TestValidator.predicate(
    "opposite parent fields cannot invent a vertex normal",
    throwsError(
      () =>
        createHumanPersonSourceNormals(cancel)!({
          face: cancel.face.positions,
          body: cancel.body.positions,
          bodyIndices: cancel.body.indices,
        }),
      "nonzero used normal",
    ),
  );
  TestValidator.predicate(
    "a valid call recovers without a retained failed field",
    evaluate(input)
      .slice(6, 9)
      .every((value, i) => nclose(value, expected[i], 1e-12)),
  );
  TestValidator.equals(
    "legacy pair selects the existing caller path",
    createHumanPersonSourceNormals({
      face: { ...fixture.face, sourcePartition: undefined },
      body: { ...fixture.body, sourcePartition: undefined },
    }),
    undefined,
  );
  TestValidator.predicate(
    "one-sided generation refuses",
    throwsError(
      () =>
        createHumanPersonSourceNormals({
          face: fixture.face,
          body: { ...fixture.body, sourcePartition: undefined },
        }),
      "both compiled halves",
    ),
  );
};
