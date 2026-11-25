import { AutoMovieIllinois } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieIllinois.root(f, a, b, tolerance, iterations)` finds a root inside a
 * sign-changing bracket by regula falsi with the Illinois halving (Dowell and
 * Jarratt 1971).
 *
 * Scenarios:
 *
 * 1. x^2 - 2 on [0, 2] and on [2, 0] gives sqrt 2 within 1e-12.
 * 2. x^10 - 0.5 on [0, 1], where plain regula falsi stagnates on one side,
 *    reaches |f| <= 1e-12 within 60 steps.
 * 3. An end at a root is returned as it is; ends of one sign give null; zero
 *    steps return the first end.
 */
export function test_unit_engine_geometry_illinois_root(): void {
  const square = (x: number): number => x * x - 2;

  // 1.
  for (const [a, b] of [
    [0, 2],
    [2, 0],
  ] satisfies [number, number][])
    TestValidator.predicate(`[${a}, ${b}]`, Math.abs(AutoMovieIllinois.root(square, a, b, 1e-14, 100)! - Math.SQRT2) <= 1e-12);

  // 2.
  const steep = (x: number): number => x ** 10 - 0.5;
  const root: number | null = AutoMovieIllinois.root(steep, 0, 1, 1e-12, 60);
  TestValidator.predicate("stagnation", root !== null && Math.abs(steep(root)) <= 1e-12);

  // 3.
  TestValidator.equals(
    "ends",
    [
      AutoMovieIllinois.root((x: number): number => x - 1, 1, 3, 1e-12, 10),
      AutoMovieIllinois.root((x: number): number => x - 3, 1, 3, 1e-12, 10),
      AutoMovieIllinois.root((x: number): number => x * x + 1, -1, 1, 1e-12, 10),
      AutoMovieIllinois.root(square, 0, 2, 1e-12, 0),
    ],
    [1, 3, null, 0],
  );
}
