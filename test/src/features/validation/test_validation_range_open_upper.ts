import { validateRange } from "../../../../packages/engine/src/validation/validateRange";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Exercise independently open and closed scalar endpoints while preserving finite-value admission and legacy default bounds.
 *
 * Scenarios:
 *
 * 1. An open (0,180) camera interval refuses both endpoints and accepts adjacent interior values with a matching mathematical diagnostic.
 * 2. The default interval and legacy open-lower (0,90] interval retain upper equality; the default retains lower equality too.
 * 3. An unbounded maximum accepts finite values under either endpoint policy; nonfinite or wrongly typed observations remain refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateRange and inspects appended findings for open/closed endpoints, admitted neighbors and finite unbounded values, catching endpoint-policy inversion or nonfinite admission.
 * @evidence contracts/testing.md#independent-expectations Literal interval arithmetic determines whether 0/180, interior camera values and 90 belong to the authored intervals. Bracket expectations express those mathematical policies, not snapshots of validator output.
 * @evidence contracts/testing.md#distinguishing-cases Retains endpoint equality, adjacent interior, above-bound, NaN/infinity/string and infinite-upper-bound cases under both maximum policies; scene_artifact owns actual camera/light field composition.
 * @evidence contracts/testing.md#execution-ownership This named portable unit directly invokes the scalar gate with caller-owned finding arrays; it starts no camera, renderer or dynamic registration.
 */
export function test_validation_range_open_upper(): void {
  const camera: (value: unknown) => IAutoMovieConstraintViolation[] = (value: unknown): IAutoMovieConstraintViolation[] => {
    const violations: IAutoMovieConstraintViolation[] = [];
    validateRange(value, "$camera", 0, 180, "field", violations, false, false);
    return violations;
  };
  for (const value of [0, 180, 181, NaN, Infinity, "90"])
    TestValidator.predicate("open perspective refusal", camera(value).some((item: IAutoMovieConstraintViolation) : boolean => item.path === "$camera" && item.expected.includes("(0, 180)")));
  for (const value of [0.001, 90, 179.999])
    TestValidator.equals("open perspective support", camera(value), []);
  const violations: IAutoMovieConstraintViolation[] = [];
  validateRange(0, "$default", 0, 90, "field", violations);
  validateRange(90, "$default", 0, 90, "field", violations);
  validateRange(90, "$spot", 0, 90, "field", violations, false);
  TestValidator.equals("legacy equalities", violations, []);
  validateRange(-1, "$default", 0, 90, "field", violations);
  TestValidator.predicate("default bracket", violations.some((item: IAutoMovieConstraintViolation) : boolean => item.expected.includes("[0, 90]")));
  validateRange(91, "$spot", 0, 90, "field", violations, false);
  TestValidator.predicate("legacy bracket", violations.some((item: IAutoMovieConstraintViolation) : boolean => item.expected.includes("(0, 90]")));
  for (const inclusiveMax of [true, false]) {
    const unbounded: IAutoMovieConstraintViolation[] = [];
    validateRange(1, "$unbounded", 0, Infinity, "field", unbounded, true, inclusiveMax);
    TestValidator.equals("unbounded finite support", unbounded, []);
    validateRange(Infinity, "$unbounded", 0, Infinity, "field", unbounded, false, inclusiveMax);
    TestValidator.predicate("unbounded finite refusal", unbounded.some((item: IAutoMovieConstraintViolation) : boolean => item.path === "$unbounded" && item.expected.includes("> 0")));
  }
}
