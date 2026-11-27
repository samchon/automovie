import {
  minimizeHumanBrent
} from "../../../../../packages/motions/src/posture/internal/minimizeHumanBrent";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `minimizeHumanBrent` finds the least of a function of one variable on an
 * interval by Brent's `localmin` (Brent 1973, ch. 5): on a unimodal function
 * the point is the minimum within three tolerances.
 *
 * Scenarios:
 *
 * 1. The parabola `(x − 0.3)²` on [0, 1] is least at 0.3, value 0.
 * 2. `−sin x` on [0, π] is least at π/2, value −1.
 * 3. A function least at the interval's end returns a point within three
 *    tolerances of that end.
 */
export function test_motions_posture_brent_minimum(): void {
  const t: number = 1e-6;
  const parabola: minimizeHumanBrent.IMinimum = minimizeHumanBrent(
    (x: number): number => (x - 0.3) * (x - 0.3),
    0,
    1,
    t,
  );
  TestValidator.predicate(
    "the parabola's vertex",
    nclose(parabola.at, 0.3, 3 * t) && parabola.value < 1e-10,
  );
  const sine: minimizeHumanBrent.IMinimum = minimizeHumanBrent(
    (x: number): number => -Math.sin(x),
    0,
    Math.PI,
    t,
  );
  TestValidator.predicate(
    "the sine's crest",
    nclose(sine.at, Math.PI / 2, 3 * t + 1e-7) && nclose(sine.value, -1, 1e-10),
  );
  const edge: minimizeHumanBrent.IMinimum = minimizeHumanBrent(
    (x: number): number => x,
    0,
    1,
    t,
  );
  TestValidator.predicate("the least end", edge.at < 3 * t + 1e-7);
}
