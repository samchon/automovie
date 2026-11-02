import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanHeadIdentitySolve as S } from "../../../../packages/human/src/generation/AutoMovieHumanHeadIdentitySolve";
import { nclose } from "../internal/nclose";

/**
 * Coupled surface dimensions close without reading their targets back as keys.
 *
 * Scenarios:
 * 1. Independent positive lengths close from undersized and oversized starts.
 * 2. Coupled affine dimensions close against their observable outputs.
 * 3. An unresponsive or non-finite measurement retains a visible residual.
 * 4. An empty constraint set is valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the closure solver through actual measurement callbacks and observes both achieved dimensions and returned residuals. A fitted starting key is red before closure; a sound analytic surface is green after closure. An unresponsive shape remains visibly red.
 * @evidence contracts/testing.md#independent-expectations The prescribed dimensions are 100 and 80 mm. Coupled outputs are the independently specified affine forms 2x+0.2y and 0.1x+2y, not the solver's update formula. A 0.05 mm numerical allowance is twenty times tighter than the head identity tolerance. This checks numerical closure rather than anatomical landmark detection, which the whole-person anatomy audit owns.
 * @evidence contracts/testing.md#distinguishing-cases Covers below-target and above-target starts, cross-coupled lengths, a zero observation, a non-finite observation and an empty constraint set. It also verifies that an already measured final state is built once and that the final changed state is built after exhaustion, using observable rebuild callbacks.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test reached by --include human_head_identity_solve. The callbacks evaluate local arithmetic and start no host, process, GPU or person generation.
 */
export function test_human_head_identity_solve(): void {
  for (const initial of [10, 200]) {
    let x: number = initial;
    let y: number = initial;
    const length: () => number = (): number => 2 * x + 0.2 * y;
    const breadth: () => number = (): number => 0.1 * x + 2 * y;
    TestValidator.predicate("known fitted dimensions are red", Math.abs(length() - 100) > 1 && Math.abs(breadth() - 80) > 1);
    const residuals: S.IResidual[] = S.solve([
      { name: "length", target: 100, measure: length, multiply: (f: number): void => { x *= f; } },
      { name: "breadth", target: 80, measure: breadth, multiply: (f: number): void => { y *= f; } },
    ], (): void => {});
    TestValidator.predicate("surface length closes", nclose(length(), 100, 0.05));
    TestValidator.predicate("surface breadth closes", nclose(breadth(), 80, 0.05));
    TestValidator.predicate("all residuals close", residuals.every((r: S.IResidual): boolean => Math.abs(r.error) < 0.05));
  }
  const impossible: S.IResidual[] = S.solve([
    { name: "unresponsive", target: 100, measure: (): number => 0, multiply: (): void => {} },
    { name: "non-finite", target: 80, measure: (): number => NaN, multiply: (): void => {} },
  ], (): void => {});
  TestValidator.predicate("unresponsive stays red", nclose(impossible[0]!.error, -100, 1e-12));
  TestValidator.predicate("invalid stays visible", Number.isNaN(impossible[1]!.error));
  TestValidator.predicate("empty constraints", S.solve([], (): void => {}).length === 0);
  let completeBuilds: number = 0;
  let completeObserved: number = NaN;
  const complete: S.IResidual[] = S.solve([
    { name: "already-complete", target: 100, measure: (): number => completeObserved, multiply: (): void => {} },
  ], (): void => { completeBuilds++; completeObserved = 100; });
  TestValidator.predicate("a completed surface is built once", completeBuilds === 1);
  TestValidator.predicate("completed residual is retained", complete[0]!.error === 0);

  let exhaustedBuilds: number = 0;
  let updatedLength: number = 1;
  let lastBuiltLength: number = NaN;
  const exhausted: S.IResidual[] = S.solve([
    { name: "unresponsive-positive", target: 2, measure: (): number => 1, multiply: (factor: number): void => { updatedLength *= factor; } },
  ], (): void => { exhaustedBuilds++; lastBuiltLength = updatedLength; });
  TestValidator.predicate("the final changed state is built after the 32-step budget", exhaustedBuilds === 33 && lastBuiltLength === updatedLength);
  TestValidator.predicate("an exhausted constraint retains its failed residual", exhausted[0]!.error === -1);

}
