import { solvePortraitSkinSystem } from "@automovie/human/geometry/solvePortraitSkinSystem";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * A skin displacement is accepted by its original equations, not a small
 * recursive residual alone. Tests supply independent finite matrix operators;
 * no host geometry, source text or generated artifact is inspected here.
 *
 * Scenarios:
 * 1. The two-vertex Dirichlet chain 2x-y=1, 2y-x=0 gives [2/3, 1/3].
 *    The solver preserves the supplied diagonal and right-hand side.
 * 2. Empty and zero-displacement systems return the exact zero solution.
 * 3. Zero, negative and underflowing operators refuse numerical breakdown;
 *    a nonsymmetric rotation cannot masquerade as a converged skin field.
 * 4. A nearly singular positive matrix has a small recursive residual but
 *    cannot satisfy the original equations to tolerance in floating point.
 *    Recomputing the residual must refuse it, and a later good solve succeeds.
 */
export const test_subject_skin_system_residual = (): void => {
  const multiply = (x: number[]): number[] => [
    2 * x[0] - x[1],
    2 * x[1] - x[0],
  ];
  const diagonal = [2, 2];
  const rhs = [1, 0];
  const original = structuredClone({ diagonal, rhs });
  const good = (): number[] =>
    solvePortraitSkinSystem(multiply, diagonal, rhs, 1);
  const result = good();
  TestValidator.predicate(
    "independent Dirichlet chain",
    nclose(result[0], 2 / 3, 1e-12) && nclose(result[1], 1 / 3, 1e-12),
  );
  TestValidator.equals("solver inputs retained", { diagonal, rhs }, original);
  TestValidator.equals(
    "empty free population",
    solvePortraitSkinSystem(multiply, [], [], 1),
    [],
  );
  TestValidator.equals(
    "no displacement needs no iteration",
    solvePortraitSkinSystem(multiply, diagonal, [0, 0], 1),
    [0, 0],
  );
  for (const coefficient of [0, -1, Number.MIN_VALUE])
    TestValidator.predicate(
      "numerical breakdown is refused",
      throwsError(() =>
        solvePortraitSkinSystem(
          (x) => x.map((value) => coefficient * value),
          [1],
          [1],
          1,
        ),
      ),
    );
  TestValidator.predicate(
    "iteration exhaustion is refused",
    throwsError(() =>
      solvePortraitSkinSystem(
        (x) => [x[0] + x[1], -x[0] + x[1]],
        [1, 1],
        [1, 0],
        1,
      ),
    ),
  );
  // Eigenvalues are 1e-12 and approximately 2. The exact solution has order
  // 1e12, whose spacing cannot represent both RHS values to a 1e-14 residual.
  const coupling = 1 - 1e-12;
  TestValidator.predicate(
    "true residual prevents false numerical convergence",
    throwsError(() =>
      solvePortraitSkinSystem(
        (x) => [x[0] - coupling * x[1], x[1] - coupling * x[0]],
        [1, 1],
        [1, Math.PI],
        1,
      ),
    ),
  );
  TestValidator.equals("failure does not poison a later solve", good(), result);
};
