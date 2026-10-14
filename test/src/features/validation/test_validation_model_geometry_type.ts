import { validateModel } from "@automovie/engine";
import {
  IAutoMovieGeometry,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Reject an unknown runtime geometry discriminant instead of skipping both supported branches.
 *
 * Scenarios:
 * 1. Replacing the existing part geometry with a forged spline record fails at geometry.type.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model validation with an unsupported runtime variant and requires failed admission plus its discriminant finding, catching exhaustive-switch assumptions at a JSON boundary.
 * @evidence contracts/testing.md#independent-expectations The authoring geometry union supports primitive and mesh, not spline; literal type/path expectations are independent of the implementation's default branch.
 * @evidence contracts/testing.md#distinguishing-cases Owns unsupported geometry refusal; supported primitive/mesh, their malformed fields and valid-model admission have separate entries. The forged cast is the input under test, not an acceptance bypass.
 * @evidence contracts/testing.md#execution-ownership The named portable entry copies existing model records and calls engine admission without constructing geometry, loading an asset or starting a renderer.
 */
export function test_validation_model_geometry_type(): void {
  const unknownGeometry: IAutoMovieGeometry = {
    type: "spline",
  } as unknown as IAutoMovieGeometry;
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    parts: base.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
        ...part,
        geometry: unknownGeometry,
      }),
    ),
  };

  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("unknown geometry fails", result.success, false);
  TestValidator.predicate(
    "geometry type violation",
    hasViolation(result, "type", ".geometry.type"),
  );
}
