import {
  createAutoMovieSupportSectionQuery,
  evaluateAutoMovieSupportSection,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Prepared cyclic boundary reuse rechecks every offset and owns copied directions.
 *
 * Scenarios:
 * 1. Independent rectangle offsets produce their analytic corners and fresh results after the caller changes its original normal array.
 * 2. A weak pair refuses only when feasible; an offset change makes it redundant without poisoning later queries.
 * 3. Redundant diagonal planes become active, replace cardinal sides and meet exact corners; every changing section agrees with a fresh query and an empty section cannot poison the next one.
 * 4. Redundant weak planes touching an unchanged seeded corner still refuse; uncertified finite coordinates fall back successfully, and an overflowing unused intersection still refuses.
 */
export function test_unit_engine_geometry_geometry_support_section_query(): void {
  const normals: [number, number][] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  const original: [number, number][] = structuredClone(normals);
  const query: ReturnType<typeof createAutoMovieSupportSectionQuery> =
    createAutoMovieSupportSectionQuery({
      normals,
      minimumDirectionSine: 0.0001,
    });
  normals[0][0] = -1;
  const before: ReturnType<typeof query> = query([2, 1, 2, 1]);
  const expected: Set<string> = new Set(["-2,-1", "2,-1", "2,1", "-2,1"]);
  TestValidator.predicate(
    "copied directions generate the independent rectangle",
    before.length === 4 &&
      before.every((vertex: (typeof before)[number]): boolean =>
        expected.has(vertex.point.join(",")),
      ),
  );
  const after: ReturnType<typeof query> = query([3, 1, 2, 1]);
  TestValidator.predicate(
    "changed offsets generate fresh geometry without changing prior results",
    Math.max(
      ...after.map((vertex: (typeof after)[number]): number => vertex.point[0]),
    ) === 3 &&
      Math.max(
        ...before.map(
          (vertex: (typeof before)[number]): number => vertex.point[0],
        ),
      ) === 2 &&
      after !== before,
  );
  TestValidator.equals(
    "one-shot public query preserves the same canonical section",
    evaluateAutoMovieSupportSection({
      normals: original,
      offsets: [2, 1, 2, 1],
      minimumDirectionSine: 0.0001,
    }),
    before,
  );
  const diagonalNormals: [number, number][] = [
    [Math.SQRT1_2, Math.SQRT1_2],
    [-Math.SQRT1_2, Math.SQRT1_2],
    [-Math.SQRT1_2, -Math.SQRT1_2],
    [Math.SQRT1_2, -Math.SQRT1_2],
    ...original,
  ];
  const coherent: ReturnType<typeof createAutoMovieSupportSectionQuery> =
    createAutoMovieSupportSectionQuery({
      normals: diagonalNormals,
      minimumDirectionSine: 0.0001,
    });
  for (const [diagonalOffset, corners] of [
    [10, 4],
    [2.5, 8],
    [0.5, 4],
    [2 * Math.SQRT2, 4],
    [10, 4],
  ]) {
    const offsets: number[] = [
      ...new Array<number>(4).fill(diagonalOffset),
      2,
      2,
      2,
      2,
    ];
    const section: ReturnType<typeof coherent> = coherent(offsets);
    TestValidator.equals(
      "independent clipped square corner count",
      section.length,
      corners,
    );
    TestValidator.equals(
      "changing active planes retain fresh canonical incidence",
      section,
      evaluateAutoMovieSupportSection({
        normals: diagonalNormals,
        offsets,
        minimumDirectionSine: 0.0001,
      }),
    );
  }
  let emptyRefused: boolean = false;
  try {
    coherent(new Array<number>(8).fill(-1));
  } catch {
    emptyRefused = true;
  }
  TestValidator.predicate("empty intersection refuses", emptyRefused);
  TestValidator.equals(
    "failed certificate does not poison later offsets",
    coherent([10, 10, 10, 10, 2, 2, 2, 2]).length,
    4,
  );
  const delta: number = 2 ** -48,
    diagonal: number = Math.SQRT1_2;
  const weak: ReturnType<typeof createAutoMovieSupportSectionQuery> =
    createAutoMovieSupportSectionQuery({
      normals: [
        [diagonal, diagonal * (1 + delta)],
        [diagonal * (1 - delta), diagonal],
        [-1, 0],
        [0, -1],
      ],
      minimumDirectionSine: 0.0001,
    });
  for (const attempt of [0, 1]) {
    let refused: boolean = false;
    try {
      weak([0, 0, 1, 1]);
    } catch (error: unknown) {
      refused =
        error instanceof Error &&
        error.message.includes("weak-support-boundary");
    }
    TestValidator.predicate(
      `feasible weak pair refuses on attempt ${attempt}`,
      refused,
    );
    TestValidator.equals(
      "infeasible weak pair is redundant for a different offset field",
      weak([10, 1, 1, 1]).length,
      3,
    );
  }
  const touching: ReturnType<typeof createAutoMovieSupportSectionQuery> =
    createAutoMovieSupportSectionQuery({
      normals: [
        ...original,
        [diagonal, diagonal * (1 + delta)],
        [diagonal * (1 - delta), diagonal],
      ],
      minimumDirectionSine: 0.0001,
    });
  TestValidator.equals(
    "redundant weak planes begin outside a seeded square",
    touching([0, 0, 1, 1, 10, 10]).length,
    4,
  );
  let touchingRefused: boolean = false;
  try {
    // Both positive-diagonal inequalities remain redundant on [-1,0]^2,
    // but their nonparallel weak intersection is now exactly the origin.
    touching([0, 0, 1, 1, 0, 0]);
  } catch (error: unknown) {
    touchingRefused =
      error instanceof Error && error.message.includes("weak-support-boundary");
  }
  TestValidator.predicate(
    "new tight weak incidence cannot hide behind a valid seed",
    touchingRefused,
  );
  const tiny: ReturnType<typeof createAutoMovieSupportSectionQuery> =
    createAutoMovieSupportSectionQuery({
      normals: [...original, [1, 2 ** -1000]],
      minimumDirectionSine: 0.0001,
    });
  const finite: ReturnType<typeof tiny> = tiny([2, 1, 2, 1, 10]);
  TestValidator.equals(
    "uncertified finite coordinates fall back without refusing a valid section",
    tiny([2, 1, 2, 1, 1e7]),
    finite,
  );
  let overflowRefused: boolean = false;
  try {
    tiny([2, 1, 2, 1, 1e10]);
  } catch (error: unknown) {
    overflowRefused =
      error instanceof Error &&
      error.message.includes("nonfinite-support-intersection");
  }
  TestValidator.predicate(
    "unused pair coordinates still obey finite-chart admission",
    overflowRefused,
  );
  TestValidator.equals(
    "failed preflight leaves the next valid section independent",
    tiny([2, 1, 2, 1, 10]),
    finite,
  );
}
