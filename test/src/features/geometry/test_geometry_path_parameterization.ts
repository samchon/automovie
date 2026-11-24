import {
  HumanSeidelProgram as LP,
  HumanPathParameterization as TOPP,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The TOPP-RA port (`HumanPathParameterization`, Pham and Pham 2018) and its
 * Seidel solver (`HumanSeidelProgram`) on problems whose optimum is known in
 * closed form.
 *
 * Scenarios:
 *
 * 1. Seidel's two-variable program max x0 + x1 subject to x0 + 2 x1 <= 4, 3 x0 +
 *    x1 <= 6 and 0 <= x <= 10 reaches the vertex (1.6, 1.2).
 * 2. A straight path q = 2 s over s in [0, 1] on 10 intervals, |q̇| <= 1, at rest
 *    at both ends: ṡ is 0.5 at every interior gridpoint, so the constant
 *    acceleration time map takes 4 delta on each end interval and 2 delta on
 *    each of the 8 others, 2.4 seconds.
 * 3. A straight path q = s over s in [0, 1] on 10 intervals, |q̈| <= 1, at rest at
 *    both ends: the bang-bang double integrator, x_i = 2 delta min(i, N - i),
 *    whose rest-to-rest time is 2 sqrt(L / a) = 2 seconds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each case's program or path, its constraints and the closed-form optimum it is checked against.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public LP.solve2, TOPP.parametrize and TOPP.timed and checks the optimum, the parameterisation and the time map.
 * @evidence contracts/development/testing.md#independent-expectations The vertex solves the two active rows; the velocity-limited path's ṡ is the limit over |q'|; the double integrator's minimum time is the closed form 2 sqrt(L / a).
 * @evidence contracts/development/testing.md#distinguishing-cases A first-order constraint against a second-order one, and the solver alone against the whole pass.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory unit owns every case; it calls the actual public port and replaces nothing.
 */
export function test_geometry_path_parameterization(): void {
  // 1. Seidel's program.
  const vertex: LP.ISolution2 = LP.solve2(
    [1, 1],
    [
      [1, 2, -4],
      [3, 1, -6],
    ],
    [0, 0],
    [10, 10],
  );
  TestValidator.predicate(
    "Seidel's program reaches the vertex (1.6, 1.2)",
    vertex.feasible &&
      Math.abs(vertex.optvar[0] - 1.6) <= 1e-12 &&
      Math.abs(vertex.optvar[1] - 1.2) <= 1e-12,
  );

  // 2. The velocity-limited straight path.
  const grid: number[] = Array.from(
    { length: 11 },
    (_: unknown, i: number): number => i / 10,
  );
  const fast: TOPP.IResult = TOPP.parametrize({
    path: {
      gridpoints: grid,
      first: grid.map((): number[] => [2]),
      second: grid.map((): number[] => [0]),
    },
    velocities: [
      {
        first: grid.map((): number[] => [2]),
        lower: grid.map((): number[] => [-1]),
        upper: grid.map((): number[] => [1]),
      },
    ],
    accelerations: [],
    start: 0,
    end: 0,
  });
  const fastTime: number = TOPP.timed(grid, fast.parametrization).times[10]!;
  TestValidator.predicate(
    `the velocity-limited path is ṡ = 0.5 inside and takes 2.4 s (${fastTime})`,
    fast.status === "ok" &&
      fast.parametrization
        .slice(1, 10)
        .every((x: number): boolean => Math.abs(x - 0.25) <= 1e-12) &&
      Math.abs(fastTime - 2.4) <= 1e-12,
  );

  // 3. The acceleration-limited double integrator.
  const bang: TOPP.IResult = TOPP.parametrize({
    path: {
      gridpoints: grid,
      first: grid.map((): number[] => [1]),
      second: grid.map((): number[] => [0]),
    },
    velocities: [],
    accelerations: [{ lower: [-1], upper: [1] }],
    start: 0,
    end: 0,
  });
  const bangTime: number = TOPP.timed(grid, bang.parametrization).times[10]!;
  TestValidator.predicate(
    `the double integrator is bang-bang and takes 2 s (${bangTime})`,
    bang.status === "ok" &&
      bang.parametrization.every(
        (x: number, i: number): boolean =>
          Math.abs(x - 0.2 * Math.min(i, 10 - i)) <= 1e-12,
      ) &&
      Math.abs(bangTime - 2) <= 1e-12,
  );
}
