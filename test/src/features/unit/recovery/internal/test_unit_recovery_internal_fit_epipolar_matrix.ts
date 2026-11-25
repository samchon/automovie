import { fitRecoveryEpipolarMatrix } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `fitRecoveryEpipolarMatrix` fits the normalized eight-point fundamental
 * matrix of rank two, scaled to unit norm with its largest entry positive.
 *
 * Scenarios:
 *
 * 1. Eight points moved only along x (a pure translation) satisfy y^T F x = 0 for
 *    F = [t]x with t = (1, 0, 0), so the fit has unit norm, only the entries 5
 *    and 7 nonzero, and those two equal and opposite.
 * 2. Fewer than eight pairs are refused.
 */
export function test_unit_recovery_internal_fit_epipolar_matrix(): void {
  const first: [number, number][] = [
    [0, 0],
    [10, 5],
    [20, -5],
    [-10, 15],
    [5, -20],
    [30, 10],
    [-25, -10],
    [15, 25],
  ];
  const shift: number[] = [3, 5, 2, 7, 4, 6, 1, 8];
  const second: [number, number][] = first.map(
    (point: [number, number], at: number): [number, number] => [
      point[0] + shift[at]!,
      point[1],
    ],
  );
  const fitted: ReturnType<typeof fitRecoveryEpipolarMatrix> =
    fitRecoveryEpipolarMatrix(first, second, 1e-9, 64);
  const m: number[] = fitted.matrix;
  TestValidator.predicate(
    "unit norm",
    nclose(Math.hypot(...m), 1, 1e-9),
  );
  TestValidator.predicate(
    "only the translation entries",
    [0, 1, 2, 3, 4, 6, 8].every((at: number): boolean =>
      nclose(m[at]!, 0, 1e-6),
    ),
  );
  TestValidator.predicate(
    "equal and opposite entries",
    nclose(Math.abs(m[5]!), Math.SQRT1_2, 1e-6) &&
      nclose(m[5]! + m[7]!, 0, 1e-6),
  );
  TestValidator.error("seven pairs", (): unknown =>
    fitRecoveryEpipolarMatrix(first.slice(0, 7), second.slice(0, 7), 1e-9, 64),
  );
}
