import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateModel } from "../../../../packages/engine/src/validation/validateModel";
import { createModel } from "../internal/createModel";
import { hasViolation } from "../internal/hasViolation";

const hasFiniteViolation: (
  result: ReturnType<typeof validateModel>,
  path: string,
) => boolean = (
  result: ReturnType<typeof validateModel>,
  path: string,
): boolean =>
  result.success === false &&
  hasViolation(result, "range", path) &&
  result.violations.some(
    (v: IAutoMovieConstraintViolation): boolean =>
      v.kind === "range" &&
      v.path.includes(path) &&
      v.expected.includes("finite"),
  );

/**
 * Exercise finite primitive dimensions and material coefficient admission without constructing renderer resources.
 *
 * Scenarios:
 *
 * 1. Primitive dimensions must be finite positive numbers.
 * 2. Material coefficients must be finite values inside `[0,1]`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel with NaN width/metallic and infinite height, requiring refusal and finite range findings for all three fields.
 * @evidence contracts/testing.md#independent-expectations Primitive dimensions are finite and positive, and metallic is finite within [0,1]; the authored nonfinite values violate these numerical domains independently of rendering.
 * @evidence contracts/testing.md#distinguishing-cases Checks NaN and infinity in separate geometry/material fields; model_valid retains the finite admitted neighbor and other entries own finite endpoint limits.
 * @evidence contracts/testing.md#execution-ownership This named unit uses ordinary model records and a local finding predicate; no PBR upload, GPU operation or dynamic case registration occurs.
 */
export function test_validation_model_non_finite_scalars(): void {
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    parts: base.parts.map(
      (p: IAutoMovieModelPart): IAutoMovieModelPart => ({
        ...p,
        geometry: {
          type: "primitive" as const,
          shape: {
            type: "box" as const,
            width: Number.NaN,
            height: Number.POSITIVE_INFINITY,
            depth: 0.2,
          },
        },
      }),
    ),
    materials: base.materials.map(
      (m: IAutoMovieMaterial): IAutoMovieMaterial => ({
        ...m,
        metallic: Number.NaN,
      }),
    ),
  };

  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("non-finite model scalars fail", result.success, false);
  TestValidator.predicate(
    "non-finite width rejected",
    hasFiniteViolation(result, ".width"),
  );
  TestValidator.predicate(
    "non-finite height rejected",
    hasFiniteViolation(result, ".height"),
  );
  TestValidator.predicate(
    "non-finite material coefficient rejected",
    hasFiniteViolation(result, ".metallic"),
  );
}
