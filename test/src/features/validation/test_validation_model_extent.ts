import { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { IAutoMovieModel, IAutoMovieModelPart, IAutoMovieValidation } from "@automovie/interface";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Model admission refuses a collapsed box dimension.
 *
 * Scenarios:
 * 1. A zero-width box fails with a width range finding.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model validation with the existing box's width set to zero and requires failed admission plus a located width finding, catching unchecked collapsed primitive input.
 * @evidence contracts/testing.md#independent-expectations Box dimensions are finite and strictly positive, so zero violates the documented width domain while unchanged height/depth remain valid; expected kind/path are contract facts.
 * @evidence contracts/testing.md#distinguishing-cases Owns the zero-width box boundary; nonfinite scalar inputs have a separate entry, while other primitive dimension branches are outside this case. This does not construct geometry or prove all width values.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry copies existing model records and calls portable engine admission without a builder, renderer, process or native artifact.
 */
export function test_validation_model_extent(): void {
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    parts: base.parts.map((p: IAutoMovieModelPart): IAutoMovieModelPart => ({
      ...p,
      geometry: {
        type: "primitive" as const,
        shape: { type: "box" as const, width: 0, height: 0.6, depth: 0.2 },
      },
    })),
  };
  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("zero extent fails", result.success, false);
  TestValidator.predicate(
    "range violation on width",
    hasViolation(result, "range", ".width"),
  );
}
