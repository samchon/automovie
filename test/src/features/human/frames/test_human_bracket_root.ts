import { AutoMovieHumanBracketRoot } from "@automovie/human";

/**
 * The bracketed root the nail's skin reader solves its stations and crossings with.
 *
 * Scenarios:
 * 1. `s^3 - 2` on `[0, 3]`: the root `2^(1/3)` within the width of twenty-four halvings, in fewer evaluations than the bisection's.
 * 2. `atan(50 (s - 0.95))` on `[0, 1]`: a secant step from the bracket's ends overshoots past 1; every evaluation stays inside the
 *    bracket and the root 0.95 is found within the same width.
 * 3. `s + 1` on `[0, 1]` has no sign change: the plain bisection's own result, `2^-25`, is returned exactly.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanBracketRoot.solve` as the nail's skin reader does.
 * @evidence contracts/development/testing.md#independent-expectations Closed-form roots, the bisection's width `|b - a| / 2^n`, and the bisection's own midpoint without a sign change.
 * @evidence contracts/development/testing.md#distinguishing-cases An unguarded secant leaves the bracket on scenario 2; a method that drops the bisection fallback differs on scenario 3.
 * @evidence contracts/development/testing.md#execution-ownership Three scalar functions; no digit, nail or person.
 * @evidence contracts/development/common.md#meaningful-documentation Names each function, its bracket and its closed-form root.
 */
export function test_human_bracket_root(): void {
  const failures: string[] = [];
  const counted = (f: (s: number) => number): { f: (s: number) => number; at: number[] } => {
    const at: number[] = [];
    return { at, f: (s: number): number => { at.push(s); return f(s); } };
  };

  const cube = counted((s: number): number => s * s * s - 2);
  const root: number = AutoMovieHumanBracketRoot.solve(cube.f, 0, 3, 24);
  if (!(Math.abs(root - Math.cbrt(2)) <= 3 / 2 ** 24)) failures.push("cube root " + root + " is not within the bisection's width of 2^(1/3)");
  if (!(cube.at.length < 24)) failures.push("the cube took " + cube.at.length + " evaluations, no fewer than the bisection's 24");

  const steep = counted((s: number): number => Math.atan(50 * (s - 0.95)));
  const turn: number = AutoMovieHumanBracketRoot.solve(steep.f, 0, 1, 24);
  if (!(Math.abs(turn - 0.95) <= 1 / 2 ** 24)) failures.push("steep root " + turn + " is not within the width of 0.95");
  if (steep.at.some((s: number): boolean => !(s >= 0 && s <= 1))) failures.push("a step left the bracket: " + JSON.stringify(steep.at));

  const none: number = AutoMovieHumanBracketRoot.solve((s: number): number => s + 1, 0, 1, 24);
  if (none !== 2 ** -25) failures.push("without a sign change the result " + none + " is not the bisection's 2^-25");
  if (failures.length > 0) throw new Error("bracket root:\n" + failures.join("\n"));
}
