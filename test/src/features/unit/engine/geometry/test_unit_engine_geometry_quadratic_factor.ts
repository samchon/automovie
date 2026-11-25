import {
  addAutoMovieQuadraticProduct,
  assembleAutoMovieQuadraticProgram,
  createAutoMovieQuadraticConicProgram,
  createAutoMovieQuadraticFactor,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `createAutoMovieQuadraticFactor` owns one sparse KKT factor of a conic
 * program: it solves only after an update, and each owner keeps its own.
 *
 * Fixture: minimize x0^2 + 4 x1^2 (diagonal 2, 8) subject to x0 + x1 = 3. Its
 * KKT system [[2 + c, 0, 1], [0, 8, 1], [1, 1, 0]] against (0, 0, 3), with the
 * cone diagonal c, solves at c = 0 to x = (2.4, 0.6) with multiplier -4.8,
 * and at c = 1 to (12 / 13, 3 / 13, -24 / 13).
 *
 * Scenarios:
 *
 * 1. An owner not yet updated refuses to solve (undefined).
 * 2. Two owners updated at c = 0 each solve to (2.4, 0.6, -4.8) within 1e-10, and
 *    overwriting a returned vector changes neither factor.
 * 3. Updating the first to c = 1 changes its solution only; updating it back
 *    recovers the first one.
 * 4. A 2048-variable chain x_i = x_{i+1}, each in [-10, 10], has a tree KKT
 *    graph, so its factor keeps at most 4 x 2048 nonzeros.
 * 5. `addAutoMovieQuadraticProduct` keeps exact sums: (1 + 2^-27)(1 - 2^-27) - 1
 *    is -2^-54, 2^1000 x 2^-1000 is 1, and MIN_VALUE x 1 stays MIN_VALUE.
 */
export function test_unit_engine_geometry_quadratic_factor(): void {
  const data: ReturnType<typeof createAutoMovieQuadraticConicProgram> =
    createAutoMovieQuadraticConicProgram(
      assembleAutoMovieQuadraticProgram({
        diagonal: [2, 8],
        linear: [0, 0],
        rows: [{ indices: [0, 1], weights: [1, 1], lower: 3, upper: 3 }],
      }),
    );
  const first: ReturnType<typeof createAutoMovieQuadraticFactor> =
    createAutoMovieQuadraticFactor(data);
  const other: ReturnType<typeof createAutoMovieQuadraticFactor> =
    createAutoMovieQuadraticFactor(data);
  const rhs: Float64Array = Float64Array.from([0, 0, 3]);
  const solves = (
    label: string,
    owner: ReturnType<typeof createAutoMovieQuadraticFactor>,
    expected: number[],
  ): void => {
    const x: Float64Array | undefined = owner.solve(rhs);
    TestValidator.predicate(
      label,
      x !== undefined &&
        x.length === expected.length &&
        x.every((v: number, i: number): boolean => Math.abs(v - expected[i]!) < 1e-10),
    );
  };
  const base: number[] = [2.4, 0.6, -4.8];

  // 1.
  TestValidator.equals("unfactored", first.solve(rhs), undefined);

  // 2.
  TestValidator.equals("first update", first.update(Float64Array.from([0])), true);
  TestValidator.equals("other update", other.update(Float64Array.from([0])), true);
  const returned: Float64Array | undefined = first.solve(rhs);
  solves("first", first, base);
  solves("other", other, base);
  if (returned !== undefined) returned[0] = 999;
  solves("first after overwrite", first, base);

  // 3.
  TestValidator.equals("update c = 1", first.update(Float64Array.from([1])), true);
  solves("first at c = 1", first, [12 / 13, 3 / 13, -24 / 13]);
  solves("other unchanged", other, base);
  TestValidator.equals("update back", first.update(Float64Array.from([0])), true);
  solves("first recovered", first, base);

  // 4.
  const size: number = 2048;
  const tree: ReturnType<typeof createAutoMovieQuadraticFactor> = createAutoMovieQuadraticFactor(
    createAutoMovieQuadraticConicProgram(
      assembleAutoMovieQuadraticProgram({
        diagonal: new Array<number>(size).fill(1),
        linear: new Array<number>(size).fill(-2),
        rows: [
          ...Array.from({ length: size - 1 }, (_: unknown, i: number) => ({
            indices: [i, i + 1],
            weights: [1, -1],
            lower: 0,
            upper: 0,
          })),
          ...Array.from({ length: size }, (_: unknown, i: number) => ({
            indices: [i],
            weights: [1],
            lower: -10,
            upper: 10,
          })),
        ],
      }),
    ),
  );
  TestValidator.predicate("linear storage", tree.nonzeros <= 4 * size);

  // 5.
  const sum: Float64Array = new Float64Array(2);
  const total = (pairs: [number, number][]): number => {
    sum.fill(0);
    for (const [a, b] of pairs) addAutoMovieQuadraticProduct(sum, 0, a, b);
    return sum[0]! + sum[1]!;
  };
  TestValidator.equals(
    "binomial remainder",
    total([
      [1 + 2 ** -27, 1 - 2 ** -27],
      [-1, 1],
    ]),
    -(2 ** -54),
  );
  TestValidator.equals("exponent transfer", total([[2 ** 1000, 2 ** -1000]]), 1);
  TestValidator.equals("subnormal", total([[Number.MIN_VALUE, 1]]), Number.MIN_VALUE);
}
