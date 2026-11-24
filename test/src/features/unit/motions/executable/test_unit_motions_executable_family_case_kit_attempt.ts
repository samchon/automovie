import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `FamilyCaseKit.attempt` returns what the build returns, and when the build
 * throws appends that case's refusal and returns null, so the remaining cases
 * still run.
 *
 * Scenarios:
 *
 * 1. A build that returns 7 yields 7 and appends nothing.
 * 2. A build that throws yields null and appends one refused case of that name,
 *    its `planned` verdict failing with the thrown message.
 */
export function test_unit_motions_executable_family_case_kit_attempt(): void {
  const out: IMotionCaptureCase[] = [];
  TestValidator.equals(
    "a built case",
    [FamilyCaseKit.attempt(out, "built", (): number => 7), out.length],
    [7, 0],
  );
  const failed: number | null = FamilyCaseKit.attempt(
    out,
    "refused",
    (): number => {
      throw new Error("no place");
    },
  );
  TestValidator.predicate(
    "a refused case",
    failed === null &&
      out.length === 1 &&
      out[0]!.name === "refused" &&
      out[0]!.verdicts[0]!.passed === false &&
      out[0]!.verdicts[0]!.detail === "no place",
  );
}
