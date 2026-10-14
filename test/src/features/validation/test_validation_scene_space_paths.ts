import type { IAutoMovieConstraintViolation, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { remapSpaceViolations } from "../../../../packages/production/src/validators/artifacts/remapSpaceViolations";
import { appendValidation } from "../../../../packages/production/src/validators/appendValidation";

/**
 * A scene reports a space's findings under its space field without changing the original validator result, violation kind, message or source value.
 *
 * Scenarios:
 *
 * 1. A supported space retains its successful validation object.
 * 2. Refusals at the space root and a nested surface gain one scene prefix; an unrelated path and the original result remain unchanged.
 * 3. Successful warning findings are re-rooted and retained when appended.
 * 4. A path containing the input token outside the root remains unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Re-roots space validation and appends both success and failure findings, asserting paths, severity, source values and input ownership; catches discarded advice and replacement of a foreign embedded root token.
 * @evidence contracts/testing.md#independent-expectations Scene space findings gain exactly one space member beneath the input root, while foreign paths and warning severity remain unchanged. Expected addresses and severities are literal contract outcomes.
 * @evidence contracts/testing.md#distinguishing-cases Covers clean success identity, root and nested refusals, foreign and embedded-token paths, warning-only success and append order. Space geometry validation belongs to its engine tests.
 * @evidence contracts/testing.md#execution-ownership This exported unit entry directly imports portable production adapters, uses only caller-owned validation records and registers no dynamic cases or host work.
 */
export function test_validation_scene_space_paths(): void {
  const accepted: IAutoMovieValidation = { success: true };
  TestValidator.predicate("success identity", remapSpaceViolations(accepted) === accepted);
  const refused: IAutoMovieValidation.IFailure = {
    success: false,
    violations: [
      { kind: "range", severity: "error", path: "$input", expected: "invalid space", value: -1 },
      { kind: "range", severity: "error", path: "$input.surfaces[1].bounds", expected: "invalid bounds", value: 0 },
      { kind: "type", severity: "error", path: "$registry", expected: "missing surface", value: null },
    ],
  };
  const before: IAutoMovieValidation.IFailure = structuredClone(refused);
  TestValidator.equals("remapped findings", remapSpaceViolations(refused), {
    success: false,
    violations: before.violations.map((item: IAutoMovieConstraintViolation, index: number): IAutoMovieConstraintViolation => ({
      ...item,
      path: ["$input.space", "$input.space.surfaces[1].bounds", "$registry"][index],
    })),
  });
  TestValidator.equals("original findings", refused, before);
  const warning: IAutoMovieConstraintViolation = {
    kind: "physics", severity: "warning", path: "$input.surfaces[0]",
    expected: "review contact", value: 0,
  };
  const advised: IAutoMovieValidation = { success: true, warnings: [warning] };
  const mapped: IAutoMovieValidation = remapSpaceViolations(advised);
  TestValidator.equals("success advice follows scene address", mapped, {
    success: true, warnings: [{ ...warning, path: "$input.space.surfaces[0]" }],
  });
  TestValidator.equals("original advice unchanged", advised, { success: true, warnings: [warning] });
  const findings: IAutoMovieConstraintViolation[] = [];
  appendValidation(findings, mapped);
  appendValidation(findings, refused);
  appendValidation(findings, accepted);
  TestValidator.equals("advice and refusal are retained in call order", findings,
    [{ ...warning, path: "$input.space.surfaces[0]" }, ...before.violations]);
  for (const path of ["$registry.$input", "$inputExtra.field"])
    TestValidator.equals(`foreign path ${path}`, remapSpaceViolations({
      success: false, violations: [{ ...warning, severity: "error", path }],
    }), { success: false, violations: [{ ...warning, severity: "error", path }] });
}
