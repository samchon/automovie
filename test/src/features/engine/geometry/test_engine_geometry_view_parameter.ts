import { AutoMovieEngineViewParameter } from "@automovie/engine";
import type { IAutoMovieConstructionOutlineParameter } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

type P = IAutoMovieConstructionOutlineParameter;

/**
 * `AutoMovieEngineViewParameter` maps a station to a source parameter: a root map
 * +-sqrt(distance from a pole) or an angle map 2 asin sqrt((s - bottom) /
 * span), with its inverse (`station`), its derivatives in the station (`jet`),
 * the station's in the parameter (`inverseJet`), and one parameter's
 * derivatives in another (`transferJet`).
 *
 * Fixture: the root map from pole 10 upward (bottom) and downward (top); the
 * angle map on [0, 4]; a second angle map on [1, 5].
 *
 * Scenarios:
 *
 * 1. Root: 14 reads 2 and 6 reads -2 downward, and back; below the pole NaN,
 *    within tolerance of it 0; `jet` at 14 is (1/4, -1/32), `inverseJet` (4,
 *    2).
 * 2. Angle: 0, 1, 2, 3, 4 read 0, pi/3, pi/2, 2 pi/3, pi, and back; outside NaN;
 *    `jet` at 1 is (1/sqrt 3, -1/sqrt 27), `inverseJet` (sqrt 3, 1).
 * 3. `contains` admits the domain and its tolerance, 5e-3 of the span (0.02 on [0,
 *    4]) or of the root coordinate's magnitude (0.05 at the pole 10), only:
 *    -0.01 and 9.99 are in and read as the endpoint, -0.1 and 9.9 are out;
 *    `prepare` copies a map and refuses a non-increasing angle map.
 * 4. `transferJet` from the root map at 0 to the angle map [0, 4] at station 1 is
 *    (sqrt 3 / 2, -1/4); from [0, 4] to [1, 5] it matches central differences
 *    in the target parameter within 1e-6; a map to itself is (1, 0); outside a
 *    domain null.
 */
export function test_engine_geometry_view_parameter(): void {
  const V = AutoMovieEngineViewParameter;
  const up: P = { type: "root", pole: 10, end: "bottom" };
  const down: P = { type: "root", pole: 10, end: "top" };
  const angle: P = { type: "angle", bottom: 0, top: 4 };
  const shifted: P = { type: "angle", bottom: 1, top: 5 };
  const near = (a: number, b: number, e: number = 1e-12): boolean =>
    Math.abs(a - b) <= e;

  // 1.
  TestValidator.predicate(
    "root",
    near(V.at(up, 14), 2) &&
      near(V.at(down, 6), -2) &&
      near(V.station(up, 2), 14) &&
      near(V.station(down, -2), 6),
  );
  TestValidator.predicate(
    "root edges",
    Object.is(V.at(up, 9), NaN) && V.at(up, 10 - 1e-14) === 0,
  );
  const rj = V.jet(up, 14)!;
  TestValidator.predicate(
    "root jet",
    near(rj[0], 0.25) && near(rj[1], -1 / 32),
  );
  TestValidator.equals("root inverse", V.inverseJet(up, 14), [4, 2]);
  TestValidator.equals("root pole", V.jet(up, 10), null);

  // 2.
  const readings: number[] = [
    0,
    Math.PI / 3,
    Math.PI / 2,
    (2 * Math.PI) / 3,
    Math.PI,
  ];
  TestValidator.predicate(
    "angle",
    readings.every(
      (x: number, s: number): boolean =>
        near(V.at(angle, s), x) && near(V.station(angle, x), s, 1e-12),
    ),
  );
  TestValidator.predicate(
    "angle outside",
    Object.is(V.at(angle, -1), NaN) && Object.is(V.at(angle, 5), NaN),
  );
  const aj = V.jet(angle, 1)!;
  TestValidator.predicate(
    "angle jet",
    near(aj[0], 1 / Math.sqrt(3)) && near(aj[1], -1 / Math.sqrt(27)),
  );
  const ai = V.inverseJet(angle, 1)!;
  TestValidator.predicate(
    "angle inverse",
    near(ai[0], Math.sqrt(3)) && near(ai[1], 1),
  );

  // 3.
  TestValidator.equals(
    "contains",
    [
      V.contains(angle, 0),
      V.contains(angle, 4),
      V.contains(angle, -0.01),
      V.contains(angle, -0.1),
      V.contains(up, 9.99),
      V.contains(up, 9.9),
      V.contains(undefined, -5),
    ],
    [true, true, true, false, true, false, true],
  );
  TestValidator.equals(
    "tolerated end",
    [V.at(angle, -0.01), V.at(up, 9.99)],
    [0, 0],
  );
  const copied = V.prepare(angle);
  TestValidator.predicate(
    "prepare",
    copied !== angle && JSON.stringify(copied) === JSON.stringify(angle),
  );
  TestValidator.predicate(
    "prepare refuses",
    typeof V.prepare({ type: "angle", bottom: 4, top: 4 }) === "string",
  );

  // 4.
  const special = V.transferJet(
    { type: "root", pole: 0, end: "bottom" },
    angle,
    1,
  )!;
  TestValidator.predicate(
    "shared endpoint",
    near(special[0], Math.sqrt(3) / 2) && near(special[1], -0.25),
  );
  const transfer = V.transferJet(angle, shifted, 2.5)!;
  const x = (y: number): number => V.at(angle, V.station(shifted, y));
  const y0: number = V.at(shifted, 2.5);
  const h: number = 1e-4;
  TestValidator.predicate(
    "chain rule",
    near((x(y0 + h) - x(y0 - h)) / (2 * h), transfer[0], 1e-6) &&
      near((x(y0 + h) - 2 * x(y0) + x(y0 - h)) / (h * h), transfer[1], 1e-5),
  );
  TestValidator.equals("same", V.transferJet(angle, { ...angle }, 2), [1, 0]);
  TestValidator.equals("outside", V.transferJet(angle, shifted, 0.5), null);
}
