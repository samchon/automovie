import { nclose } from "../../internal/predicates";
import {
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeGirthClosure as Closure,
} from "@automovie/human";
import type { IAutoMovieHumanConicSection, IAutoMovieHumanNativeGirthClosure } from "@automovie/interface";

/**
 * The girth closure measures a section's taut tape and finds the one fullness at which the tape is a given girth, the extremes held.
 *
 * The made section is an ellipse of semi-axes 100 and 60 mm as a `limb(0)` layout: four extremes on the axes and four arcs of shoulder
 * `sqrt(2) - 1`, the shoulder of a quarter ellipse (a quarter circle's, kept by the affine map that makes the ellipse). Its perimeter is
 * the Gauss-Kummer series `pi (a + b) sum_n C(1/2, n)^2 h^n` with `h = ((a - b) / (a + b))^2 = 1 / 16`. Every section on those extremes
 * lies between the rhombus through them, `4 hypot(100, 60)`, and their box, `2 (200 + 120)`.
 *
 * Scenarios:
 * 1. The ellipse's tape is the series' perimeter within 1e-5 of it (the sampled hull's stated error).
 * 2. The tape rises with the fullness at -2, -1, 0, 1 and 2, and stays inside the rhombus and the box at the bracket's ends.
 * 3. Asked for a girth 3 % longer and 3 % shorter, the closed section measures it within 1e-6 mm, its fullness has the girth's sign, and
 *    its eight extreme coordinates are the given numbers; asked for its own tape it returns the given vector itself with fullness zero.
 * 4. A girth of the box's perimeter and one under the rhombus's are refused; a nonpositive girth is refused.
 * 5. A made bilateral section (front 120, side [20, 180], back -90, medians 0.5, shoulders 0.45) closed on a girth 2 % longer keeps
 *    its four millimetre fields, raises both medians and all four shoulders, and measures the girth within 1e-6 mm.
 * 6. `shift` by zero returns the given numbers; a field vector shorter than its layout is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production tape, shift and solve on made sections and measures the solved section again through the production tape.
 * @evidence contracts/development/testing.md#independent-expectations The ellipse's perimeter is the Gauss-Kummer series, the bounds are the rhombus and the box of the extremes, and the solved tape is compared with the asked girth; none is read from the solve.
 * @evidence contracts/development/testing.md#distinguishing-cases A longer and a shorter girth, the identity, both refusals of range, two layouts (with and without medians), monotony either side of zero; all findings are collected.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous pure arithmetic on two made field vectors; no family, person or loft.
 * @evidence contracts/development/common.md#meaningful-documentation States the made sections and each scenario's closed form.
 */
export function test_human_native_girth_closure(): void {
  const failures: string[] = [];
  const close = (what: string, got: number, expected: number, tolerance: number): void => {
    if (!nclose(got, expected, tolerance)) failures.push(`${what}: ${got} against ${expected}`);
  };
  const refused = (what: string, bad: () => unknown): void => {
    let thrown: boolean = false;
    try {
      bad();
    } catch {
      thrown = true;
    }
    if (!thrown) failures.push(what + " was accepted");
  };
  const [a, b]: [number, number] = [100, 60];
  const quarter: number = Math.SQRT2 - 1;
  const layout: IAutoMovieHumanConicSection.ILayout = S.limb(0);
  const ellipse: number[] = [a, 0, 0, b, -a, 0, 0, -b, quarter, quarter, quarter, quarter];

  // The Gauss-Kummer series: the n-th coefficient is the square of C(1/2, n), and C(1/2, n) = C(1/2, n - 1) (3 - 2n) / (2n).
  const h: number = ((a - b) / (a + b)) ** 2;
  let [series, binomial]: [number, number] = [1, 1];
  for (let n: number = 1; n <= 12; ++n) {
    binomial *= (3 - 2 * n) / (2 * n);
    series += binomial ** 2 * h ** n;
  }
  const perimeter: number = Math.PI * (a + b) * series;
  const rhombus: number = 4 * Math.hypot(a, b);
  const box: number = 2 * (2 * a + 2 * b);

  // 1. The tape of a known curve.
  const own: number = Closure.tape(ellipse, layout);
  close("the ellipse's tape", own, perimeter, 1e-5 * perimeter);

  // 2. Monotone in the fullness, inside the rhombus and the box.
  const tapes: number[] = [-8, -2, -1, 0, 1, 2, 8].map((fullness: number): number => Closure.tape(Closure.shift(ellipse, layout, fullness), layout));
  for (let k: number = 1; k < tapes.length; ++k) if (!(tapes[k]! > tapes[k - 1]!)) failures.push("the tape did not rise with the fullness: " + JSON.stringify(tapes));
  if (!(tapes[0]! > rhombus && tapes.at(-1)! < box)) failures.push("a tape left the rhombus and the box of its extremes: " + JSON.stringify([rhombus, tapes[0], tapes.at(-1), box]));

  // 3. Closed on a longer and a shorter girth; the identity.
  for (const ratio of [1.03, 0.97]) {
    const closed: IAutoMovieHumanNativeGirthClosure.IClosed = Closure.solve(ellipse, layout, ratio * own);
    close("the closed tape at " + ratio, closed.tape, ratio * own, 1e-6);
    close("the closed section measured again at " + ratio, Closure.tape(closed.values, layout), ratio * own, 1e-6);
    if (Math.sign(closed.fullness) !== Math.sign(ratio - 1)) failures.push("the fullness at " + ratio + " has the wrong sign: " + closed.fullness);
    if (closed.values.slice(0, 8).some((x: number, k: number): boolean => x !== ellipse[k])) failures.push("an extreme moved at " + ratio);
  }
  const same: IAutoMovieHumanNativeGirthClosure.IClosed = Closure.solve(ellipse, layout, own);
  if (same.values !== ellipse || same.fullness !== 0) failures.push("a section that measures its girth was not returned as given");

  // 4. Out of reach.
  refused("the box's perimeter", (): unknown => Closure.solve(ellipse, layout, box));
  refused("a girth under the rhombus", (): unknown => Closure.solve(ellipse, layout, rhombus - 1));
  refused("a nonpositive girth", (): unknown => Closure.solve(ellipse, layout, 0));

  // 5. A bilateral section: front, median, side, median, back, then four shoulders.
  const half: IAutoMovieHumanConicSection.ILayout = S.bilateral(1);
  const trunk: number[] = [120, 0.5, 20, 180, 0.5, -90, 0.45, 0.45, 0.45, 0.45];
  const girth: number = 1.02 * Closure.tape(trunk, half);
  const fuller: IAutoMovieHumanNativeGirthClosure.IClosed = Closure.solve(trunk, half, girth);
  close("the bilateral section's closed tape", fuller.tape, girth, 1e-6);
  for (const k of [0, 2, 3, 5]) if (fuller.values[k] !== trunk[k]) failures.push("the bilateral section's millimetre field " + k + " moved");
  for (const k of [1, 4, 6, 7, 8, 9]) if (!(fuller.values[k]! > trunk[k]!)) failures.push("the bilateral section's share " + k + " did not rise");

  // 6. The shift's identity and its refusal.
  const unmoved: number[] = Closure.shift(trunk, half, 0);
  unmoved.forEach((x: number, k: number): void => close("an unshifted field " + k, x, trunk[k]!, 1e-15));
  refused("a short field vector", (): unknown => Closure.shift(trunk.slice(0, 8), half, 1));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
