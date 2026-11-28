import {
  validateExpression
} from "../../../../../packages/engine/src/validation/internal/validateExpression";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateExpression` holds an expression's intensity and every blendshape
 * weight to [0, 1] and refuses a channel set twice, each at its own path.
 *
 * Scenarios:
 *
 * 1. A neutral expression at intensity 0.5 with one 0.5 jaw weight passes.
 * 2. Intensity 1.5, then a second jaw channel weighing 2: a range finding at the
 *    intensity, then at the second weight, then a type finding at the repeated
 *    channel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers valid expression fields and independently located intensity, weight and duplicate-channel faults.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the expression validator with one eligible preset and with specified typed channel rows, then compares the ordered findings.
 * @evidence contracts/development/testing.md#independent-expectations The accepted intensity and weight are both one half. Values 1.5 and two exceed [0, 1], and the two rows name the same channel, requiring a distinct duplicate finding.
 */
export function test_engine_validation_validate_expression(): void {
  const findings = (intensity: number, weights: number[]): string[][] =>
    validateExpression({
      expression: {
        preset: "neutral",
        intensity,
        blendshapes: weights.map((weight: number) => ({
          channel: "jawOpen",
          weight,
        })),
      },
    }).items.map((item: IAutoMovieConstraintViolation): string[] => [
      item.kind,
      item.path,
    ]);
  TestValidator.equals(
    "each expression's findings",
    [findings(0.5, [0.5]), findings(1.5, [0.5, 2])],
    [
      [],
      [
        ["range", "$input.intensity"],
        ["range", "$input.blendshapes[1].weight"],
        ["type", "$input.blendshapes[1].channel"],
      ],
    ],
  );
}
