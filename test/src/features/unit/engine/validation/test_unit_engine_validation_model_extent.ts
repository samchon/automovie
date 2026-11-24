import { validateModel } from "@automovie/engine";
import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Model admission refuses a collapsed box dimension.
 *
 * Scenarios:
 *
 * 1. A zero-width box fails with a width range finding.
 */
export function test_unit_engine_validation_model_extent(): void {
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    parts: base.parts.map(
      (p: IAutoMovieModelPart): IAutoMovieModelPart => ({
        ...p,
        geometry: {
          type: "primitive" as const,
          shape: { type: "box" as const, width: 0, height: 0.6, depth: 0.2 },
        },
      }),
    ),
  };
  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("zero extent fails", result.success, false);
  TestValidator.predicate(
    "range violation on width",
    hasViolation(result, "range", ".width"),
  );
}
