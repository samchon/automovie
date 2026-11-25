import { validateExpression } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateExpression` holds an expression's intensity and every blendshape
 * weight to [0, 1] and refuses a channel set twice, each at its own path.
 *
 * Scenarios:
 *
 * 1. A neutral expression at intensity 0.5 with one 0.5 jaw weight passes.
 * 2. Intensity 1.5, then a second jaw channel weighing 2: a range finding at
 *    the intensity, then at the second weight, then a type finding at the
 *    repeated channel.
 */
export function test_unit_engine_validation_validate_expression(): void {
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
