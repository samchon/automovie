/**
 * Factor a two-column camera-direction design without normal equations.
 * Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the
 * two singular values of R give the same direction rank as the original design.
 * Their ratio is a binary64 diagnostic under the supplied numeric threshold,
 * not a certified interval bound or uncertainty distribution.
 *
 * @evidence contracts/common.md#principled-implementation Reorthogonalized QR acts on the original two direction columns and solves each right-hand side by orthogonal projection and triangular substitution. The determinant product of R and its largest singular value yield the smaller singular value without forming or inverting a normal matrix.
 * @evidence contracts/common.md#clear-and-simple-design One call-local factorization owns one camera design and transfers a reusable pure solve closure to the section fitter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normal-equation inverse, ridge term, small-denominator replacement, discarded view or fixture-specific direction supplies a solution; weak or nonfinite geometry refuses.
 * @evidence contracts/common.md#meaningful-documentation States the factorization, reuse scope, binary64 rank-ratio interpretation, solve assumptions and refusal behavior.
 * @evidence contracts/performance.md#efficient-algorithms For V camera directions, two-column factorization and each right-hand side cost O(V), retaining two V-entry orthonormal columns instead of a per-section dense inverse.
 * @evidence contracts/performance.md#reuse-equivalent-work One factorization serves all physical section rows for exactly its supplied camera columns and is discarded when that fitting request returns.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure owns two O(V) arrays and scalar factors for the request lifetime; it acquires no file, process, listener or global cache.
 */
export function createRecoveryImageDirectionSolver(
  directions: readonly [number, number][],
  minimumRatio: number,
): { ratio: number; solve: (values: readonly number[]) => [number, number] } {
  let r00: number = 0;
  for (const row of directions) r00 = Math.hypot(r00, row[0]);
  if (!(r00 > 0) || !Number.isFinite(r00))
    throw new Error(
      "weak-support-directions: first direction column is degenerate",
    );
  const q0: number[] = directions.map(
    (row: readonly [number, number]): number => row[0] / r00,
  );
  let r01: number = directions.reduce(
    (sum: number, row: readonly [number, number], index: number): number =>
      sum + q0[index] * row[1],
    0,
  );
  const residual: number[] = directions.map(
    (row: readonly [number, number], index: number): number =>
      row[1] - q0[index] * r01,
  );
  const correction: number = residual.reduce(
    (sum: number, value: number, index: number): number =>
      sum + q0[index] * value,
    0,
  );
  r01 += correction;
  let r11: number = 0;
  for (let index: number = 0; index < residual.length; index++) {
    residual[index] -= correction * q0[index];
    r11 = Math.hypot(r11, residual[index]);
  }
  const largest: number =
    (Math.hypot(r00 + r11, r01) + Math.hypot(r00 - r11, r01)) / 2;
  const ratio: number = (r00 / largest) * (r11 / largest);
  if (!(ratio >= minimumRatio) || !Number.isFinite(ratio))
    throw new Error(
      "weak-support-directions: supplied camera columns do not identify both section axes",
    );
  const q1: number[] = residual.map((value: number): number => value / r11);
  return {
    ratio,
    solve: (values: readonly number[]): [number, number] => {
      if (values.length !== directions.length)
        throw new Error("Direction right-hand side must retain every view");
      let first: number = 0,
        second: number = 0;
      for (let index: number = 0; index < values.length; index++) {
        if (!Number.isFinite(values[index]))
          throw new Error(
            "Nonfinite section support cannot enter direction fitting",
          );
        first += q0[index] * values[index];
        second += q1[index] * values[index];
      }
      const z: number = second / r11,
        x: number = (first - r01 * z) / r00;
      if (!Number.isFinite(x) || !Number.isFinite(z))
        throw new Error("Direction solve exceeded finite arithmetic");
      return [x, z];
    },
  };
}
