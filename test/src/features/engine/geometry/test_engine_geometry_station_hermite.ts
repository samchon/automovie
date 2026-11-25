import { AutoMovieStationHermite } from "@automovie/engine";
import type { IAutoMovieStationHermite } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieStationHermite.weights(u, H, order, quintic)` are the Hermite
 * weights of [f_a, f'_a, f''_a, f''_b, f'_b, f_b] for the value or a station
 * derivative at u of an interval of width H; `combine` applies them.
 *
 * Fixture: the interval [1, 3] (H = 2); the quintic q(s) = s^5 - 2 s^3 + s and
 * the cubic c(s) = s^3 - s, each given with value, slope and curvature at both
 * ends.
 *
 * Scenarios:
 *
 * 1. At u = 0 and 1 the value weights select f_a and f_b; the cubic slope weights
 *    at u = 0 select f'_a, and the cubic rule puts 0 on both curvatures.
 * 2. The quintic rule reproduces q, q' and q'' at u = 0.3 (s = 1.6) within 1e-12.
 * 3. The cubic rule reproduces c, c' and c'' there, its curvatures ignored.
 */
export function test_engine_geometry_station_hermite(): void {
  const end = (
    f: (s: number) => number[],
    s: number,
  ): IAutoMovieStationHermite.IEnd => {
    const [v, d, dd] = f(s);
    return { value: [v!], slope: [d!], curvature: [dd!] };
  };
  const q = (s: number): number[] => [
    s ** 5 - 2 * s ** 3 + s,
    5 * s ** 4 - 6 * s ** 2 + 1,
    20 * s ** 3 - 12 * s,
  ];
  const c = (s: number): number[] => [s ** 3 - s, 3 * s ** 2 - 1, 6 * s];

  // 1.
  TestValidator.equals(
    "start",
    AutoMovieStationHermite.weights(0, 2, 0, true),
    [1, 0, 0, 0, 0, 0],
  );
  TestValidator.equals(
    "finish",
    AutoMovieStationHermite.weights(1, 2, 0, true),
    [0, 0, 0, 0, 0, 1],
  );
  TestValidator.equals(
    "slope",
    AutoMovieStationHermite.weights(0, 2, 1, false),
    [0, 1, 0, 0, 0, 0],
  );
  const cubic: number[] = AutoMovieStationHermite.weights(0.3, 2, 0, false);
  TestValidator.equals("no curvature", [cubic[2], cubic[3]], [0, 0]);

  // 2. and 3.
  for (const [label, f, quintic] of [
    ["quintic", q, true],
    ["cubic", c, false],
  ] satisfies [string, (s: number) => number[], boolean][]) {
    const want: number[] = f(1.6);
    for (const order of [0, 1, 2] satisfies (0 | 1 | 2)[]) {
      const got: number = AutoMovieStationHermite.combine(
        end(f, 1),
        end(f, 3),
        AutoMovieStationHermite.weights(0.3, 2, order, quintic),
      )[0]!;
      TestValidator.predicate(
        `${label} ${order}`,
        Math.abs(got - want[order]!) <= 1e-12,
      );
    }
  }
}
