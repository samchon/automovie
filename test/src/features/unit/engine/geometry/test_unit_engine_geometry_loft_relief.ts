import { AutoMovieLoftRelief } from "@automovie/engine";
import type { IAutoMovieLoftRelief } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieLoftRelief` evaluates a relief's height over its window, a uniform
 * cubic B-spline net in station and phase whose three outer rings are zero:
 * `height` gives [d, d_s, d_t], `jet` adds second derivatives and the lips'
 * station shift, `direction` the world direction it moves along, `width` the
 * window's phase width.
 *
 * Fixture: the window 10..30 mm by phase 0..1 rad, a 7 x 7 net whose only
 * nonzero control is the centre (3, 3) at 9 mm; its basis peaks at the window's
 * centre with weight 2/3 each way.
 *
 * Scenarios:
 *
 * 1. At the centre (20, 0.5) the height is 4 and both slopes 0; outside the
 *    window, at its edges and a phase past it, all zero.
 * 2. At (14, 0.3) the slopes are the central differences of the height within
 *    1e-6, and the jet's first three entries are the height's.
 * 3. The jet's second derivatives are the central differences of its slopes
 *    within 1e-5.
 * 4. A zero shift net leaves the jet unchanged; a shift net of 2 mm on the 3 x 3
 *    centre block, whose weights sum to 1 at the centre, reads the height at
 *    the centre 2 mm further along the station, at 22 mm.
 * 5. With a turn (0, 0, 1) the direction at the middle phase 0.5 is the axis (1,
 *    0, 0), its derivative the turn and its second derivative minus the axis;
 *    at phase 1 it is (cos 0.5, 0, sin 0.5) with its derivative the central
 *    difference; without a turn the axis with zero derivatives.
 * 6. The width of phases (1, 1) is a whole turn; of (6, 0.5) it wraps.
 */
export function test_unit_engine_geometry_loft_relief(): void {
  const net = (centre: number): number[] => Array.from({ length: 49 }, (_: unknown, k: number): number => (k === 24 ? centre : 0));
  const relief: IAutoMovieLoftRelief = {
    name: "bump",
    stations: [10, 30],
    phases: [0, 1],
    axis: [1, 0, 0],
    rows: 7,
    columns: 7,
    heights: net(9),
  };
  const h = (s: number, t: number) => AutoMovieLoftRelief.height(relief, s, t);
  const near = (a: number, b: number, e: number = 1e-12): boolean => Math.abs(a - b) <= e;

  // 1.
  const centre = h(20, 0.5);
  TestValidator.predicate("centre", near(centre[0], 4) && near(centre[1], 0) && near(centre[2], 0));
  TestValidator.equals("outside", [h(5, 0.5), h(10, 0.5), h(30, 0.5), h(20, 1), h(20, 2)], [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]);

  // 2.
  const e: number = 1e-5;
  const [, ds, dt] = h(14, 0.3);
  TestValidator.predicate(
    "slopes",
    near((h(14 + e, 0.3)[0] - h(14 - e, 0.3)[0]) / (2 * e), ds, 1e-6) && near((h(14, 0.3 + e)[0] - h(14, 0.3 - e)[0]) / (2 * e), dt, 1e-6),
  );
  const jet: number[] = AutoMovieLoftRelief.jet(relief, 14, 0.3);
  TestValidator.predicate("jet agrees", near(jet[0]!, h(14, 0.3)[0]) && near(jet[1]!, ds) && near(jet[2]!, dt));

  // 3.
  const j = (s: number, t: number): number[] => AutoMovieLoftRelief.jet(relief, s, t);
  TestValidator.predicate(
    "second",
    near((j(14 + e, 0.3)[1]! - j(14 - e, 0.3)[1]!) / (2 * e), jet[3]!, 1e-5) &&
      near((j(14, 0.3 + e)[1]! - j(14, 0.3 - e)[1]!) / (2 * e), jet[4]!, 1e-5) &&
      near((j(14, 0.3 + e)[2]! - j(14, 0.3 - e)[2]!) / (2 * e), jet[5]!, 1e-5),
  );

  // 4.
  TestValidator.equals("zero shift", AutoMovieLoftRelief.jet({ ...relief, shift: net(0) }, 14, 0.3), jet);
  const flat: number[] = Array.from({ length: 49 }, (_: unknown, k: number): number => {
    const r: number = Math.floor(k / 7);
    const c: number = k % 7;
    return r >= 2 && r <= 4 && c >= 2 && c <= 4 ? 2 : 0;
  });
  const shifted: number[] = AutoMovieLoftRelief.jet({ ...relief, shift: flat }, 20, 0.5);
  TestValidator.predicate("shift", near(shifted[0]!, h(22, 0.5)[0]));

  // 5.
  const [ex, et, ett] = AutoMovieLoftRelief.direction({ ...relief, turn: [0, 0, 1] }, 0.5);
  TestValidator.equals("turned", [ex, et, ett], [[1, 0, 0], [0, 0, 1], [-1, -0, -0]]);
  const turn = (p: number) => AutoMovieLoftRelief.direction({ ...relief, turn: [0, 0, 1] }, p);
  const [e1, e1t, e1tt] = turn(1);
  TestValidator.predicate(
    "turned away from the middle",
    near(e1[0], Math.cos(0.5)) &&
      near(e1[2], Math.sin(0.5)) &&
      [0, 2].every((k: number): boolean => near((turn(1 + e)[0][k]! - turn(1 - e)[0][k]!) / (2 * e), e1t[k]!, 1e-9) && near(e1tt[k]!, -e1[k]!)),
  );
  TestValidator.equals("fixed", AutoMovieLoftRelief.direction(relief, 0.2), [[1, 0, 0], [0, 0, 0], [0, 0, 0]]);

  // 6.
  TestValidator.predicate("whole turn", near(AutoMovieLoftRelief.width({ ...relief, phases: [1, 1] }), 2 * Math.PI));
  TestValidator.predicate("wrap", near(AutoMovieLoftRelief.width({ ...relief, phases: [6, 0.5] }), 0.5 - 6 + 2 * Math.PI));
}
