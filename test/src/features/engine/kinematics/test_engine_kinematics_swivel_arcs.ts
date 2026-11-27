import { AutoMovieEngineSwivelArcs } from "@automovie/engine";
import type { IAutoMovieSwivelArcs } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineSwivelArcs` reads sinusoids a + b cos s + c sin s of a swivel s (degrees):
 * the exact fit from three values, the arc above a margin, the least swivel and
 * value, the roots, and unions of arcs over one turn with their coverage,
 * nearest outside swivel, complement and holding arc.
 *
 * Fixture: the union M of the arcs [350, 370] and [5, 20], which merges into
 * [-355, -340], [-10, 20], [350, 380] and [710, 730].
 *
 * Scenarios:
 *
 * 1. Values 3, 1, -1 at 0, 90, 180 fit 1 + 2 cos s; scaling by 2 and combining f
 *    once with g twice act on each coefficient.
 * 2. The sinusoid cos s exceeds 0.5 on [-60, 60], -2 everywhere, 1 nowhere.
 * 3. The sinusoid sin s is least at -90, a constant nowhere; cos s over [-30, 30]
 *    is at least cos 30, over [90, 270] and over a whole turn at least -1.
 * 4. The sinusoid cos s vanishes at 270 and 90; 1 + cos s only at 180; 2 + cos s
 *    and a constant never.
 * 5. Union M as above; [0, 10] and [10, 20] touch and merge; [0, 200] with [190,
 *    370] is every swivel. A 512-degree interval starting three binary64 steps
 *    below 2^62 also covers every swivel. Rounding the product of the turn
 *    quotient and 360 shifts its lifted start to -512, so the three copies
 *    merge into [-872, 360], including the exact upper endpoint.
 * 6. M covers [355, 365] and [715, 718], not [25, 30]; every swivel covers all.
 * 7. Nearest outside M: 0 to -10, 15 to 20, 100 stays; none outside every swivel.
 * 8. Complement of M is [20, 350]; of none, [0, 360]; of every swivel, none; of
 *    [100, 200], [200, 460].
 * 9. [10, 20] holds 375 as [370, 380] and not 25.
 */
export function test_engine_kinematics_swivel_arcs(): void {
  const near = (x: number, y: number): boolean => Math.abs(x - y) <= 1e-12;
  const cos: IAutoMovieSwivelArcs.ISinusoid = { a: 0, b: 1, c: 0 };
  const sin: IAutoMovieSwivelArcs.ISinusoid = { a: 0, b: 0, c: 1 };

  // 1.
  TestValidator.equals("fitted", AutoMovieEngineSwivelArcs.fitted(3, 1, -1), {
    a: 1,
    b: 2,
    c: 0,
  });
  TestValidator.equals("scaled", AutoMovieEngineSwivelArcs.scaled({ a: 1, b: 2, c: 3 }, 2), {
    a: 2,
    b: 4,
    c: 6,
  });
  TestValidator.equals(
    "combined",
    AutoMovieEngineSwivelArcs.combined({ a: 1, b: 0, c: 0 }, 1, { a: 0, b: 1, c: 1 }, 2),
    { a: 1, b: 2, c: 2 },
  );

  // 2.
  const above = AutoMovieEngineSwivelArcs.above(cos, 0.5);
  TestValidator.predicate(
    "above",
    above !== null &&
      above !== "all" &&
      near(above.from, -60) &&
      near(above.to, 60),
  );
  TestValidator.equals(
    "all and none",
    [AutoMovieEngineSwivelArcs.above(cos, -2), AutoMovieEngineSwivelArcs.above(cos, 1)],
    ["all", null],
  );

  // 3.
  TestValidator.equals(
    "least",
    [AutoMovieEngineSwivelArcs.least(sin), AutoMovieEngineSwivelArcs.least({ a: 4, b: 0, c: 0 })],
    [-90, null],
  );
  TestValidator.predicate(
    "lowest ends",
    near(AutoMovieEngineSwivelArcs.lowest(cos, -30, 30), Math.cos(Math.PI / 6)),
  );
  TestValidator.equals(
    "lowest trough",
    [AutoMovieEngineSwivelArcs.lowest(cos, 90, 270), AutoMovieEngineSwivelArcs.lowest(cos, 0, 400)],
    [-1, -1],
  );

  // 4.
  const roots: number[] = AutoMovieEngineSwivelArcs.roots(cos);
  TestValidator.predicate(
    "roots",
    roots.length === 2 && near(roots[0]!, 270) && near(roots[1]!, 90),
  );
  TestValidator.equals(
    "tangent and none",
    [
      AutoMovieEngineSwivelArcs.roots({ a: 1, b: 1, c: 0 }),
      AutoMovieEngineSwivelArcs.roots({ a: 2, b: 1, c: 0 }),
      AutoMovieEngineSwivelArcs.roots({ a: 0, b: 0, c: 0 }),
    ],
    [[180], [], []],
  );

  // 5.
  const M = AutoMovieEngineSwivelArcs.union([
    { from: 350, to: 370 },
    { from: 5, to: 20 },
  ]);
  TestValidator.equals("union", M, [
    { from: -355, to: -340 },
    { from: -10, to: 20 },
    { from: 350, to: 380 },
    { from: 710, to: 730 },
  ]);
  TestValidator.equals(
    "touching arcs merge",
    AutoMovieEngineSwivelArcs.union([
      { from: 0, to: 10 },
      { from: 10, to: 20 },
    ]),
    [
      { from: -360, to: -340 },
      { from: 0, to: 20 },
      { from: 360, to: 380 },
    ],
  );
  TestValidator.equals(
    "every swivel",
    AutoMovieEngineSwivelArcs.union([
      { from: 0, to: 200 },
      { from: 190, to: 370 },
    ]),
    "all",
  );
  const lifted: number = 2 ** 62 - 3 * 512;
  TestValidator.equals(
    "an exact closed turn remains covered after a large lift",
    AutoMovieEngineSwivelArcs.union([{ from: lifted, to: lifted + 512 }]),
    "all",
  );

  // 6.
  TestValidator.equals(
    "covers",
    [
      AutoMovieEngineSwivelArcs.covers(M, 355, 365),
      AutoMovieEngineSwivelArcs.covers(M, 715, 718),
      AutoMovieEngineSwivelArcs.covers(M, 25, 30),
      AutoMovieEngineSwivelArcs.covers("all", 0, 1),
    ],
    [true, true, false, true],
  );

  // 7.
  TestValidator.equals(
    "nearest",
    [
      AutoMovieEngineSwivelArcs.nearest(M, 0),
      AutoMovieEngineSwivelArcs.nearest(M, 15),
      AutoMovieEngineSwivelArcs.nearest(M, 100),
      AutoMovieEngineSwivelArcs.nearest("all", 5),
    ],
    [-10, 20, 100, null],
  );

  // 8.
  TestValidator.equals("complement", AutoMovieEngineSwivelArcs.complement(M), [
    { from: 20, to: 350 },
  ]);
  TestValidator.equals("complement empty", AutoMovieEngineSwivelArcs.complement([]), [
    { from: 0, to: 360 },
  ]);
  TestValidator.equals("complement all", AutoMovieEngineSwivelArcs.complement("all"), []);
  TestValidator.equals(
    "complement across",
    AutoMovieEngineSwivelArcs.complement([{ from: 100, to: 200 }]),
    [{ from: 200, to: 460 }],
  );

  // 9.
  TestValidator.equals(
    "holding",
    [
      AutoMovieEngineSwivelArcs.holding([{ from: 10, to: 20 }], 375),
      AutoMovieEngineSwivelArcs.holding([{ from: 10, to: 20 }], 25),
    ],
    [{ from: 370, to: 380 }, null],
  );
}
