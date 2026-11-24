import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `FamilyCaseKit.refused` turns a refused performance into a case with no
 * figure and one failing `planned` verdict naming the refusal.
 *
 * Scenarios:
 *
 * 1. An error's message becomes the verdict's detail.
 * 2. A thrown string is shown as it is.
 */
export function test_unit_motions_executable_family_case_kit_refused(): void {
  const refused: IMotionCaptureCase = FamilyCaseKit.refused(
    "kick",
    new Error("out of reach"),
  );
  TestValidator.equals(
    "the refused case",
    [refused, FamilyCaseKit.refused("kick", "late").verdicts],
    [
      {
        name: "kick",
        times: [{ seconds: 0, label: "refused" }],
        performers: [],
        verdicts: [{ name: "planned", passed: false, detail: "out of reach" }],
      },
      [{ name: "planned", passed: false, detail: "late" }],
    ],
  );
}
