import type { IAutoMovieRecoveryImageDirectionSolverCreationOperation } from "@automovie/interface";

/**
 * Factor a two-column camera-direction design without normal equations.
 * Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the two
 * singular values of R give the same direction rank as the original design.
 * Their ratio is a binary64 diagnostic under the supplied numeric threshold,
 * not a certified interval bound or uncertainty distribution.
 */
export function createRecoveryImageDirectionSolver(
  directions: Parameters<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation>[0],
  minimumRatio: Parameters<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation> {
  let r00: number = 0;
  for (const row of directions) r00 = Math.hypot(r00, row[0]);
  if (!(r00 > 0))
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
  if (!(ratio >= minimumRatio))
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
        first += q0[index] * values[index];
        second += q1[index] * values[index];
      }
      const z: number = second / r11,
        x: number = (first - r01 * z) / r00;
      return [x, z];
    },
  };
}
