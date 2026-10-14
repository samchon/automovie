import type { IAutoMovieConstraintViolation, IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { entryDuration } from "@automovie/production/validation/entryDuration";
import { validateTrim } from "@automovie/production/validation/validateTrim";
import { validateTransition } from "@automovie/production/validation/validateTransition";
import { nclose } from "../internal/predicates";

/**
 * Played spans remain finite positive seconds before overlap arithmetic.
 * A trim fits its source shot inclusively; absent shot identity cannot invent
 * an adjacent duration, while untrimmed entries use the registry duration.
 *
 * Scenarios:
 *
 * 1. Null, scalar and array payloads refuse at the trim/transition boundary.
 * 2. Zero start and an exact-end trim are accepted; overflow, nonfinite and
 *    wrongly typed values are addressed without hiding independent errors.
 * 3. Unknown source duration supplies no bound, and transitions accept only
 *    finite strictly positive spans.
 * 4. A missing shot has no played span; numeric trims override a known shot,
 *    while absent, scalar or nonnumeric trims leave its duration unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls trim/transition admission and played-duration projection directly, asserting located findings and selected seconds. Invalid scalar fields remain independent findings instead of authorizing overlap arithmetic or suppressing one another.
 * @evidence contracts/testing.md#independent-expectations A five-second authored shot supplies inclusive trim end and registry duration; finite nonnegative start and strictly positive spans define acceptance. Expected diagnostic paths identify the contract fields, while numeric projection alone does not certify a trim is valid.
 * @evidence contracts/testing.md#distinguishing-cases Covers malformed shapes, exact end versus overflow, zero/nonfinite/wrongly typed spans, simultaneous bad fields, missing registry resolution and trim precedence. Neighbor overlap and two-layer sequence admission belong to the sequence artifact unit.
 * @evidence contracts/testing.md#execution-ownership This discoverable named unit directly invokes portable production validators with local finding arrays and an authored shot record. It starts no project filesystem, renderer or native host and owns all cases in this entry.
 */
export function test_validation_sequence_spans(): void {
  const trimPaths: (value: unknown, duration?: number) => string[] = (value: unknown, duration: number = 5): string[] => {
    const violations: IAutoMovieConstraintViolation[] = [];
    validateTrim(value, duration, "$trim", violations);
    return violations.map((item: IAutoMovieConstraintViolation): string => item.path);
  };
  const transitionPaths: (value: unknown) => string[] = (value: unknown): string[] => {
    const violations: IAutoMovieConstraintViolation[] = [];
    validateTransition(value, "$transition", violations);
    return violations.map((item: IAutoMovieConstraintViolation): string => item.path);
  };
  for (const value of [null, [], 1]) {
    TestValidator.equals("trim shape", trimPaths(value), ["$trim"]);
    TestValidator.equals("transition shape", transitionPaths(value), ["$transition"]);
  }
  TestValidator.equals("exact shot end", trimPaths({ start: 0, duration: 5 }), []);
  TestValidator.equals("inside shot", trimPaths({ start: 1, duration: 3 }), []);
  TestValidator.equals("overflow", trimPaths({ start: 1, duration: 5 }), ["$trim"]);
  TestValidator.equals("unknown shot bound", trimPaths({ start: 1, duration: 5 }, Infinity), []);
  for (const start of [-1, NaN, Infinity, "0"])
    TestValidator.predicate("invalid start", trimPaths({ start, duration: 1 }).includes("$trim.start"));
  for (const duration of [0, -1, NaN, Infinity, "1"])
    TestValidator.predicate("invalid trim duration", trimPaths({ start: 0, duration }).includes("$trim.duration"));
  TestValidator.equals("independent trim errors", trimPaths({ start: NaN, duration: NaN }), ["$trim.start", "$trim.duration"]);
  TestValidator.equals("positive transition", transitionPaths({ duration: 0.5 }), []);
  for (const duration of [0, -1, NaN, Infinity, "1"])
    TestValidator.equals("invalid transition duration", transitionPaths({ duration }), ["$transition.duration"]);
  const shot: IAutoMovieShot = {
    id: "beat", name: null, scene: "stage", camera: "camera",
    cameraMotion: null, performances: [], objectMotions: [], duration: 5,
  };
  TestValidator.equals("missing shot", entryDuration({ trim: { duration: 2 } }, undefined), null);
  TestValidator.predicate("numeric trim", nclose(entryDuration({ trim: { duration: 2 } }, shot)!, 2));
  for (const trim of [undefined, null, 1, {}, { duration: "2" }])
    TestValidator.predicate("registry duration", nclose(entryDuration({ trim }, shot)!, 5));
}
