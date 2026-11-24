import { AutoMovieHumanBracketLeast } from "@automovie/human";

/**
 * The least of a function of one variable within a bracket, by Brent's method.
 *
 * Scenarios:
 * 1. `(x - 0.3)^2 + 0.1 (x - 0.3)^4` on `[0, 1]`: its least, at 0.3, found within twice Brent's tolerance (`sqrt(eps) |x|` and a third of the asked width `0.618^40`), in
 *    fewer than the 80 reads that forty golden sections of two reads each took.
 * 2. `|x - 0.7|`, whose least has no parabola: found at 0.7 within the same tolerance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanBracketLeast.least` and counts its reads.
 * @evidence contracts/development/testing.md#independent-expectations Both leasts are known in closed form.
 * @evidence contracts/development/testing.md#distinguishing-cases A golden search that reads two values a section fails the count; a parabolic step without its safeguard misses the kink.
 * @evidence contracts/development/testing.md#execution-ownership Two made functions.
 * @evidence contracts/development/common.md#meaningful-documentation Names each function, its least and the width.
 */
export function test_human_bracket_least(): void {
  const failures: string[] = [];
  const width: number = ((Math.sqrt(5) - 1) / 2) ** 40;
  let reads: number = 0;
  const quartic = (x: number): number => {
    reads += 1;
    return (x - 0.3) ** 2 + 0.1 * (x - 0.3) ** 4;
  };
  const smooth: { at: number; value: number } = AutoMovieHumanBracketLeast.least(quartic, 0, 1, width);
  // Brent's stopping rule leaves the abscissa within twice its tolerance, `sqrt(eps) |x| + width / 3`.
  const within = (x: number): number => 2 * (Math.sqrt(Number.EPSILON) * Math.abs(x) + width / 3);
  if (!(Math.abs(smooth.at - 0.3) <= within(0.3))) failures.push("the smooth least stands at " + smooth.at);
  if (!(reads < 80)) failures.push("the smooth least took " + reads + " reads");
  const kink: { at: number; value: number } = AutoMovieHumanBracketLeast.least((x: number): number => Math.abs(x - 0.7), 0, 1, width);
  if (!(Math.abs(kink.at - 0.7) <= within(0.7))) failures.push("the kinked least stands at " + kink.at);
  if (failures.length > 0) throw new Error("bracket least:\n" + failures.join("\n"));
}
