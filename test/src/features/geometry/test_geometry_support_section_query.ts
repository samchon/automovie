import { createAutoMovieSupportSectionQuery } from "@automovie/engine/geometry/createAutoMovieSupportSectionQuery";
import { evaluateAutoMovieSupportSection } from "@automovie/engine/geometry/evaluateAutoMovieSupportSection";
import { TestValidator } from "@nestia/e2e";

/**
 * Fixed direction preparation retains no changing-offset or caller-array state.
 *
 * Scenarios:
 * 1. Independent rectangle offsets produce their analytic corners and fresh results after the caller changes its original normal array.
 * 2. A weak pair refuses only when feasible; an offset change makes it redundant without poisoning later queries.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the actual public preparation closure repeatedly and the existing one-shot query. It observes new section corners, unchanged prior output, copied direction ownership and offset-dependent weak refusal.
 * @evidence contracts/testing.md#independent-expectations Cardinal half-planes with offsets [2,1,2,1] intersect at X=+/-2,Z=+/-1; changing only the positive-X offset moves that side to X=3. The almost parallel diagonal pair meets feasibly at the origin for zero offsets but is redundant when its first bound is 10 and the other is 1.
 * @evidence contracts/testing.md#distinguishing-cases Distinguishes fixed direction reuse from stale offset caching, caller-array borrowing, shared mutable results and unconditional weak-pair deletion/refusal. The existing engine test owns invalid fields, physical mesh incidence and numerical determinant cases.
 * @evidence contracts/testing.md#execution-ownership This portable test_geometry_support_section_query entry owns bounded CPU arrays and query closures only, without filesystem, process, renderer, build or foreign replacement.
 */
export function test_geometry_support_section_query(): void {
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
}
