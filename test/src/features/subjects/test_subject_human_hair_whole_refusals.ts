import { Vector3, createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import { fitHumanFaceHairRibbonRows } from "@automovie/human/face/anatomy/hair/fitHumanFaceHairRibbonRows";
import { TestValidator } from "@nestia/e2e";

import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { throwsError } from "../internal/predicates";

/**
 * Unsupported free centres, collapsed represented coverage and missing derived
 * readers refuse without spending a hidden retry or changing the metric path.
 * Scenarios:
 * 1. A cube-crossing centre chord cannot be repaired by hiding its row width.
 * 2. A free centre closer than its requested gap refuses before profile fitting.
 * 3. Positive binary64 radii lost at Float32 coordinates cannot count as width.
 * 4. Nonpositive/nonfinite/above-nominal radii and missing readers refuse by name.
 * 5. A short shared budget retains exhaustion, while empty rows need no work.
 * 6. Missing vectors and invalid root/stem/free order or root boundary metadata
 *    refuse before source fitting, adjacent to the supported dense free row.
 */
export const test_subject_human_hair_whole_refusals = (): void => {
  const mesh = createSignedVoxelUnion([[0, 0, 0]]);
  const source = createAutoMovieMeshSeparationQuery(mesh);
  const represented = createAutoMovieMeshSeparationQuery({
    ...mesh,
    positions: mesh.positions.map(Math.fround),
  });
  const row = (x: number) => ({
    point: Vector3.create(x, 0.25, 0.25),
    across: Vector3.create(0, 1, 0),
    radius: 0.01,
    nominal: 0.01,
    v: 0,
    region: "free" as const,
  });
  const props = {
    clearance: 0.1,
    source,
    represented,
    budget: { remaining: 1_000_000 },
    attachment: undefined,
  };
  const missing = [
    null,
    { ...row(2), point: undefined },
    { ...row(2), point: null },
    { ...row(2), across: undefined },
    { ...row(2), across: null },
  ];
  for (const invalid of missing)
    TestValidator.predicate(
      "missing derived row vectors refuse",
      throwsError(
        () =>
          fitHumanFaceHairRibbonRows(
            [invalid] as unknown as Parameters<typeof fitHumanFaceHairRibbonRows>[0],
            props,
          ),
        "dense finite",
      ),
    );
  const root = { ...row(2), radius: 0, region: "root" as const };
  const invalidRegions = [
    [{ ...row(2), region: "unknown" }],
    [root],
    [{ ...root, radius: 0.01 }, row(2.1)],
    [row(2), root],
    [root, row(2.1)],
  ];
  for (const invalid of invalidRegions)
    TestValidator.predicate(
      "invalid root region metadata refuses",
      throwsError(
        () =>
          fitHumanFaceHairRibbonRows(
            invalid as unknown as Parameters<typeof fitHumanFaceHairRibbonRows>[0],
            props,
          ),
        "region",
      ),
    );
  TestValidator.predicate(
    "a second root cannot restart the same profile",
    throwsError(
      () =>
        fitHumanFaceHairRibbonRows([root, root], {
          ...props,
          attachment: { triangle: 0, weights: [1, 0, 0], supports: [0] },
        }),
      "region",
    ),
  );
  TestValidator.equals(
    "adjacent dense free row remains supported",
    fitHumanFaceHairRibbonRows([row(2)], props).length,
    1,
  );
  TestValidator.predicate(
    "crossing centre chord refuses",
    throwsError(
      () => fitHumanFaceHairRibbonRows([row(-1), { ...row(2), v: 1 }], props),
      "boundary chord",
    ),
  );
  TestValidator.predicate(
    "unsupported free centre refuses",
    throwsError(
      () =>
        fitHumanFaceHairRibbonRows(
          [
            {
              ...row(1.01),
              radius: 1,
              nominal: 1,
              across: Vector3.create(1, 0, 0),
            },
          ],
          props,
        ),
      "free centre",
    ),
  );
  TestValidator.predicate(
    "positive Double width cannot hide F32 collapse",
    throwsError(
      () =>
        fitHumanFaceHairRibbonRows(
          [{ ...row(2), point: Vector3.create(2, 1e9, 0.25) }],
          props,
        ),
      "positive represented row width",
    ),
  );
  for (const [radius, nominal] of [
    [0, 1],
    [-1, 1],
    [NaN, 1],
    [Infinity, 1],
    [1, 0],
    [1, NaN],
    [1, Infinity],
    [2, 1],
  ])
    TestValidator.predicate(
      "unsupported radii refuse",
      throwsError(
        () =>
          fitHumanFaceHairRibbonRows([{ ...row(2), radius, nominal }], props),
        "positive coverage radii",
      ),
    );
  for (const absent of [undefined, null]) {
    TestValidator.predicate(
      "legacy context refuses",
      throwsError(
        () => fitHumanFaceHairRibbonRows([], absent as unknown as typeof props),
        "resident separation readers",
      ),
    );
    for (const key of ["source", "represented"] as const)
      TestValidator.predicate(
        "legacy reader refuses",
        throwsError(
          () =>
            fitHumanFaceHairRibbonRows([], {
              ...props,
              [key]: absent,
            } as unknown as typeof props),
          "resident separation readers",
        ),
      );
  }
  const budget = { remaining: 1 };
  TestValidator.predicate(
    "shared geometry budget exhausts without reset",
    throwsError(
      () => fitHumanFaceHairRibbonRows([row(2)], { ...props, budget }),
      "exhausted",
    ),
  );
  TestValidator.equals("spent budget retained", budget.remaining, 0);
  const emptyBudget = { remaining: 0 };
  TestValidator.predicate(
    "sparse derived rows refuse",
    throwsError(
      () => fitHumanFaceHairRibbonRows(new Array(2), props),
      "dense finite",
    ),
  );
  TestValidator.predicate(
    "nonfinite row metadata refuses",
    throwsError(
      () => fitHumanFaceHairRibbonRows([{ ...row(2), v: NaN }], props),
      "dense finite",
    ),
  );
  TestValidator.predicate(
    "free clearance cannot regress to stem",
    throwsError(
      () =>
        fitHumanFaceHairRibbonRows(
          [row(2), { ...row(2.1), region: "stem" }],
          props,
        ),
      "region",
    ),
  );
  TestValidator.equals(
    "empty profile needs no geometry work",
    fitHumanFaceHairRibbonRows([], { ...props, budget: emptyBudget }).length,
    0,
  );
  TestValidator.equals(
    "empty profile spends nothing",
    emptyBudget.remaining,
    0,
  );
};
