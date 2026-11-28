import { AutoMovieEngineIllinois } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineIllinois.root(f, a, b, tolerance, iterations)` finds a root inside
 * a sign-changing bracket by regula falsi with the Illinois halving (Dowell and
 * Jarratt 1971).
 *
 * Scenarios:
 *
 * 1. The function x^2 - 2 on [0, 2] and on [2, 0] gives sqrt 2 within 1e-12.
 * 2. The function exp(x) - 2 on [0, 5], where plain regula falsi keeps one end for
 *    hundreds of steps, reaches ln 2 with |f| <= 1e-12 within 20 steps (13
 *    suffice).
 * 3. An end at a root is returned as it is; ends of one sign give null; zero steps
 *    return the first end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names bracket order, stagnation control, budget and endpoint decisions.
 * @evidence contracts/development/testing.md#behavioral-verification Finds roots of the actual quadratic and exponential functions with the public solver and observes its bracket and exhausted-step limits.
 * @evidence contracts/development/testing.md#independent-expectations The written functions have roots √2 and ln(2). Endpoint roots and same-sign bounds are identified directly from their function values.
 */
export function test_engine_geometry_illinois_root(): void {
  const square = (x: number): number => x * x - 2;

  // 1.
  for (const [a, b] of [
    [0, 2],
    [2, 0],
  ] satisfies [number, number][])
    TestValidator.predicate(
      `[${a}, ${b}]`,
      Math.abs(
        AutoMovieEngineIllinois.root(square, a, b, 1e-14, 100)! - Math.SQRT2,
      ) <= 1e-12,
    );

  // 2.
  const steep = (x: number): number => Math.exp(x) - 2;
  const root: number | null = AutoMovieEngineIllinois.root(steep, 0, 5, 1e-12, 20);
  TestValidator.predicate(
    "stagnation",
    root !== null &&
      Math.abs(steep(root)) <= 1e-12 &&
      Math.abs(root - Math.LN2) <= 1e-12,
  );

  // 3.
  TestValidator.equals(
    "ends",
    [
      AutoMovieEngineIllinois.root((x: number): number => x - 1, 1, 3, 1e-12, 10),
      AutoMovieEngineIllinois.root((x: number): number => x - 3, 1, 3, 1e-12, 10),
      AutoMovieEngineIllinois.root(
        (x: number): number => x * x + 1,
        -1,
        1,
        1e-12,
        10,
      ),
      AutoMovieEngineIllinois.root(square, 0, 2, 1e-12, 0),
    ],
    [1, 3, null, 0],
  );
}
