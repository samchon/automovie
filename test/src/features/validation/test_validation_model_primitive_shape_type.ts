import { validateModel } from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/createModel";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise closed primitive-shape admission with a forged discriminant and otherwise positive dimensions.
 *
 * Scenarios:
 * 1. A primitive part carries an unknown torus shape with positive radius and height. Validation fails with a type violation on the shape discriminant.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateModel on a torus-labelled primitive and requires a type finding at geometry.shape.type, catching fallthrough to a supported radius/height branch.
 * @evidence contracts/development/testing.md#independent-expectations The supported primitive union excludes torus; positive dimensions cannot admit an unknown variant, and the expected field is authored independently of a generated mesh.
 * @evidence contracts/development/testing.md#distinguishing-cases Owns the unsupported shape with valid-looking dimensions; model_valid owns supported box admission and extent tests own invalid dimensions.
 * @evidence contracts/development/testing.md#execution-ownership This named unit passes a deliberately forged record to the portable model validator; it builds no torus geometry or external asset.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: A primitive part carries an unknown torus shape with positive radius and height. Validation fails with a type violation on the shape...).
 */
export function test_validation_model_primitive_shape_type(): void {
  const unknownShape: AutoMoviePrimitiveShape = {
    type: "torus",
    radius: 1,
    height: 1,
  } as unknown as AutoMoviePrimitiveShape;
  const base: IAutoMovieModel = createModel();
  const model: IAutoMovieModel = {
    ...base,
    parts: base.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
        ...part,
        geometry: {
          type: "primitive" as const,
          shape: unknownShape,
        },
      }),
    ),
  };

  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("unknown primitive shape fails", result.success, false);
  TestValidator.predicate(
    "shape type violation",
    hasViolation(result, "type", ".geometry.shape.type"),
  );
}
