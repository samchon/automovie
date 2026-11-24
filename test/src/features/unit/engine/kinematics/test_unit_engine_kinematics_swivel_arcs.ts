import { swivelArcs } from "@automovie/engine";
import type { IAutoMovieSwivelArcs } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * A swivel's sinusoids and the arcs where they exceed a margin
 * (`swivelArcs`).
 *
 * Scenarios:
 * 1. `fitted` from the values at 0, 90 and 180 degrees reproduces each of 50
 *    seeded sinusoids at every 10 degrees within 1e-12.
 * 2. `above` returns the arc between the roots: each end reads the margin
 *    within 1e-9, the midpoint reads more and a degree past either end
 *    reads less; a sinusoid whose least exceeds the margin is every swivel,
 *    and one whose greatest does not is none.
 * 3. `union` merges the arcs 350 to 370 and 5 to 20 into one across 0 and
 *    keeps 100 to 110 apart; `covers` holds 355 to 15 and -5 to 2 and not
 *    90 to 105; `nearest` keeps 50, moves 12 to 20 and 101 to 100; arcs
 *    covering a turn are every swivel, which `covers` holds everywhere and
 *    `nearest` leaves no swivel outside of.
 */
export function test_unit_engine_kinematics_swivel_arcs(): void {
  const value = (f: IAutoMovieSwivelArcs.ISinusoid, degrees: number): number =>
    f.a +
    f.b * Math.cos((degrees * Math.PI) / 180) +
    f.c * Math.sin((degrees * Math.PI) / 180);

  // 1. The fit.
  let seed: number = 20261115;
  const random = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648 - 0.5;
  };
  for (let k: number = 0; k < 50; k++) {
    const f: IAutoMovieSwivelArcs.ISinusoid = {
      a: random(),
      b: random(),
      c: random(),
    };
    const fit: IAutoMovieSwivelArcs.ISinusoid = swivelArcs.fitted(
      value(f, 0),
      value(f, 90),
      value(f, 180),
    );
    for (let degrees: number = 0; degrees < 360; degrees += 10)
      TestValidator.predicate(
        `fitted reproduces sinusoid ${k} at ${degrees} degrees`,
        nclose(value(fit, degrees), value(f, degrees), 1e-12),
      );
  }

  // 2. The arc above a margin.
  const f: IAutoMovieSwivelArcs.ISinusoid = { a: 0.2, b: 0.6, c: -0.8 };
  const arc: IAutoMovieSwivelArcs.IArc | "all" | null = swivelArcs.above(
    f,
    0.5,
  );
  TestValidator.predicate(
    "above finds an arc",
    typeof arc === "object" && arc !== null,
  );
  if (typeof arc === "object" && arc !== null) {
    TestValidator.predicate(
      "the arc's ends read the margin",
      nclose(value(f, arc.from), 0.5, 1e-9) &&
        nclose(value(f, arc.to), 0.5, 1e-9),
    );
    TestValidator.predicate(
      "inside reads more and outside less",
      value(f, (arc.from + arc.to) / 2) > 0.5 &&
        value(f, arc.from - 1) < 0.5 &&
        value(f, arc.to + 1) < 0.5,
    );
  }
  TestValidator.equals(
    "a sinusoid above the margin everywhere",
    swivelArcs.above({ a: 2, b: 0.6, c: -0.8 }, 0.5),
    "all",
  );
  TestValidator.equals(
    "a sinusoid nowhere above the margin",
    swivelArcs.above({ a: -1, b: 0.6, c: -0.8 }, 0.5),
    null,
  );

  // 3. The union and its readings.
  const merged: IAutoMovieSwivelArcs.IArc[] | "all" = swivelArcs.union([
    { from: 350, to: 370 },
    { from: 5, to: 20 },
    { from: 100, to: 110 },
  ]);
  TestValidator.predicate(
    "the arcs across 0 merge",
    merged !== "all" &&
      merged.some(
        (a: IAutoMovieSwivelArcs.IArc): boolean =>
          nclose(a.from, -10) && nclose(a.to, 20),
      ),
  );
  TestValidator.predicate(
    "covers holds across the seam",
    swivelArcs.covers(merged, 355, 375) && swivelArcs.covers(merged, -5, 2),
  );
  TestValidator.predicate(
    "covers refuses an interval leaving the union",
    !swivelArcs.covers(merged, 90, 105),
  );
  TestValidator.equals(
    "nearest keeps a swivel outside",
    swivelArcs.nearest(merged, 50),
    50,
  );
  TestValidator.predicate(
    "nearest moves a swivel to the nearer end",
    nclose(swivelArcs.nearest(merged, 12) ?? Number.NaN, 20) &&
      nclose(swivelArcs.nearest(merged, 101) ?? Number.NaN, 100),
  );
  const full: IAutoMovieSwivelArcs.IArc[] | "all" = swivelArcs.union([
    { from: 0, to: 200 },
    { from: 180, to: 370 },
  ]);
  TestValidator.equals("a full turn is every swivel", full, "all");
  TestValidator.predicate(
    "every swivel is covered and none lies outside",
    swivelArcs.covers(full, 10, 20) && swivelArcs.nearest(full, 10) === null,
  );
}
